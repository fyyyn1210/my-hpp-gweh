import { and, asc, eq, gte, ne, sql } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { commodities, commodityPrices, notas, users } from "#src/drizzle/schemas/index.js";
import { dateOfDay, dayIndex } from "#src/utils/date.util.js";
import { PriceSource, TODAY } from "#src/utils/hpp.constant.js";

export interface PriceRow {
    commodityId: string;
    source: PriceSource;
    price: number;
    priceDate: Date;
}

const fillSeries = (points: Map<number, number>) => {
    const first = [...points.keys()].sort((a, b) => a - b)[0];
    let last = points.get(first)!;
    return Array.from({ length: TODAY + 1 }, (_, day) => (last = points.get(day) ?? last));
};

export const listCommodities = async () => {
    const [items, prices] = await Promise.all([
        db.select().from(commodities).orderBy(asc(commodities.sortOrder)),
        db.select().from(commodityPrices)
            .where(and(eq(commodityPrices.source, PriceSource.Pihps), gte(commodityPrices.priceDate, dateOfDay(0))))
            .orderBy(asc(commodityPrices.priceDate)),
    ]);
    const points = new Map<string, Map<number, number>>();
    for (const row of prices) {
        const day = dayIndex(row.priceDate);
        if (day > TODAY) continue;
        if (!points.has(row.commodityId)) points.set(row.commodityId, new Map());
        points.get(row.commodityId)!.set(day, row.price);
    }
    return items
        .filter((item) => points.has(item.id))
        .map(({ sortOrder, ...item }) => ({ ...item, prices: fillSeries(points.get(item.id)!) }));
};

export const ingestPrices = async (rows: PriceRow[]) => {
    if (rows.length === 0) return 0;
    await db.insert(commodityPrices).values(rows).onConflictDoUpdate({
        target: [commodityPrices.commodityId, commodityPrices.source, commodityPrices.priceDate],
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
