import { and, asc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { commodities, commodityPrices, notas, users } from "#src/drizzle/schemas/index.js";
import { FULL_CATALOG } from "#src/drizzle/seeds/catalog.js";
import { dateOfDay, dayIndex } from "#src/utils/date.util.js";
import { NATIONAL_REGION, PriceSource, TODAY } from "#src/utils/hpp.constant.js";

export interface PriceRow {
    commodityId: string;
    source: PriceSource;
    region: string;
    price: number;
    priceDate: Date;
}

const fillSeries = (points: Map<number, number>) => {
    const first = [...points.keys()].sort((a, b) => a - b)[0];
    let last = points.get(first)!;
    return Array.from({ length: TODAY + 1 }, (_, day) => (last = points.get(day) ?? last));
};

const MARKET_SOURCES = [PriceSource.Pihps, PriceSource.Sp2kp];
const REFERENCE_PRICES = new Map(FULL_CATALOG.flatMap((item) => (item.referencePrice ? [[item.id, item.referencePrice] as const] : [])));

export const listCommodities = async (region = NATIONAL_REGION) => {
    const [items, prices] = await Promise.all([
        db.select().from(commodities).orderBy(asc(commodities.sortOrder)),
        db.select().from(commodityPrices)
            .where(and(inArray(commodityPrices.source, MARKET_SOURCES), inArray(commodityPrices.region, [NATIONAL_REGION, region]), gte(commodityPrices.priceDate, dateOfDay(0))))
            .orderBy(asc(commodityPrices.priceDate)),
    ]);
    const points = new Map<string, Map<number, number>>();
    for (const scope of [NATIONAL_REGION, region]) {
        const scoped = new Map<string, Map<number, number>>();
        for (const row of prices) {
            const day = dayIndex(row.priceDate);
            if (row.region !== scope || day > TODAY) continue;
            const key = `${row.commodityId}|${row.source}`;
            if (!scoped.has(key)) scoped.set(key, new Map());
            scoped.get(key)!.set(day, row.price);
        }
        for (const [key, series] of scoped) points.set(key, series);
    }
    return items.flatMap(({ sortOrder, ...item }) => {
        const source = MARKET_SOURCES.find((candidate) => points.has(`${item.id}|${candidate}`));
        if (source) return [{ ...item, source, prices: fillSeries(points.get(`${item.id}|${source}`)!) }];
        const reference = REFERENCE_PRICES.get(item.id);
        return reference ? [{ ...item, source: PriceSource.Reference, prices: Array<number>(TODAY + 1).fill(reference) }] : [];
    });
};

export const ingestPrices = async (rows: PriceRow[]) => {
    if (rows.length === 0) return 0;
    await db.insert(commodityPrices).values(rows).onConflictDoUpdate({
        target: [commodityPrices.commodityId, commodityPrices.source, commodityPrices.region, commodityPrices.priceDate],
        set: { price: sql`excluded.price` },
    });
    return rows.length;
};

export const communityVotes = async (userId: string, city: string) => {
    const rows = await db
        .select({ commodityId: notas.commodityId, pricePerKg: notas.pricePerKg, recordedAt: notas.recordedAt })
        .from(notas)
        .innerJoin(users, eq(users.id, notas.userId))
        .where(and(eq(notas.shared, true), eq(users.shareCommunity, true), eq(users.city, city), ne(notas.userId, userId), gte(notas.recordedAt, dateOfDay(0))));
    return rows;
};
