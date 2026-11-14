import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { logger } from "#src/configs/pino.config.js";
import { commodities, commodityPrices } from "#src/drizzle/schemas/index.js";
import { CATALOG, FULL_CATALOG, type CatalogCommodity } from "#src/drizzle/seeds/catalog.js";
import { ingestPrices, type PriceRow } from "#src/modules/commodities/commodity.service.js";
import { dropSpikes, parsePihps, parsePihpsMirror } from "#src/modules/commodities/pihps.parser.js";
import { dateOfDay, MS_PER_DAY, startOfDay } from "#src/utils/date.util.js";
import { dummyPihpsSeries } from "#src/modules/commodities/pihps.dummy.js";
import { NATIONAL_REGION, PriceSource } from "#src/utils/hpp.constant.js";
import {
    PIHPS_COMMODITY,
    PIHPS_GRID_URL,
    PIHPS_MIRROR_URL,
    PIHPS_PROVINCE,
    PIHPS_RESYNC_DAYS,
    PIHPS_TIMEOUT_MS,
    PIHPS_TRADITIONAL_MARKET,
} from "#src/utils/pihps.constant.js";

export const dummyPihpsRows = (commodity: CatalogCommodity, today = new Date()): PriceRow[] =>
    dummyPihpsSeries(commodity).map((price, day) => ({ commodityId: commodity.id, source: PriceSource.Pihps, region: NATIONAL_REGION, price, priceDate: dateOfDay(day, today) }));

export const upsertCatalog = async () => {
    await db.insert(commodities)
        .values(FULL_CATALOG.map((item, index) => ({
            id: item.id,
            name: item.name,
            icon: item.icon,
            priceUnit: item.priceUnit,
            aliases: item.aliases,
            unitOverrides: item.unitOverrides ?? {},
            sortOrder: index,
        })))
        .onConflictDoUpdate({
            target: commodities.id,
            set: {
                name: sql`excluded.name`,
                icon: sql`excluded.icon`,
                priceUnit: sql`excluded.price_unit`,
                aliases: sql`excluded.aliases`,
                unitOverrides: sql`excluded.unit_overrides`,
                sortOrder: sql`excluded.sort_order`,
            },
        });
};

export const ingestDummyPihps = async () =>
    (await db.$count(commodityPrices, eq(commodityPrices.source, PriceSource.Pihps))) > 0 ? 0 : ingestPrices(CATALOG.flatMap((item) => dummyPihpsRows(item)));

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const fetchPihps = async (region: string, start: Date, end: Date) => {
    const params = new URLSearchParams({
        price_type_id: String(PIHPS_TRADITIONAL_MARKET),
        comcat_id: Object.values(PIHPS_COMMODITY).map((item) => item.id).join(","),
        province_id: PIHPS_PROVINCE[region],
        regency_id: "",
        market_id: "",
        tipe_laporan: "1",
        start_date: isoDate(start),
        end_date: isoDate(end),
    });
    const res = await fetch(`${PIHPS_GRID_URL}?${params}`, { signal: AbortSignal.timeout(PIHPS_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`PIHPS ${region}: HTTP ${res.status}`);
    return parsePihps(await res.json(), region);
};

const regionFilter = (region: string) => and(eq(commodityPrices.source, PriceSource.Pihps), eq(commodityPrices.region, region));

const syncStart = async (region: string, full: boolean, today: Date) => {
    const first = dateOfDay(0, today);
    if (full) return first;
    const [latest] = await db.select({ priceDate: commodityPrices.priceDate }).from(commodityPrices)
        .where(regionFilter(region)).orderBy(desc(commodityPrices.priceDate)).limit(1);
    if (!latest) return first;
    const resync = new Date(startOfDay(latest.priceDate).getTime() - PIHPS_RESYNC_DAYS * MS_PER_DAY);
    return resync > first ? resync : first;
};

const referencePrices = async (region: string, start: Date, full: boolean) => {
    if (full) return new Map<string, number>();
    const rows = await db.selectDistinctOn([commodityPrices.commodityId], { commodityId: commodityPrices.commodityId, price: commodityPrices.price })
        .from(commodityPrices)
        .where(and(regionFilter(region), lt(commodityPrices.priceDate, start)))
        .orderBy(commodityPrices.commodityId, desc(commodityPrices.priceDate));
    return new Map(rows.map((row) => [`${row.commodityId}|${region}`, row.price]));
};

const replaceWindow = (region: string, start: Date, rows: PriceRow[]) =>
    db.transaction(async (tx) => {
        await tx.delete(commodityPrices).where(and(
            regionFilter(region),
            gte(commodityPrices.priceDate, start),
            inArray(commodityPrices.commodityId, [...new Set(rows.map((row) => row.commodityId))]),
        ));
        await tx.insert(commodityPrices).values(rows);
    });

const fetchMirror = async () => {
    const rows: PriceRow[] = [];
    for (const [commodityId, item] of Object.entries(PIHPS_COMMODITY)) {
        const res = await fetch(`${PIHPS_MIRROR_URL}?komoditas=${item.id}`, { signal: AbortSignal.timeout(PIHPS_TIMEOUT_MS) });
        if (!res.ok) throw new Error(`PIHPS mirror ${item.id}: HTTP ${res.status}`);
        rows.push(...parsePihpsMirror(await res.json(), commodityId, Object.keys(PIHPS_PROVINCE)));
    }
    return rows;
};

const syncMirror = async (region: string, mirror: Promise<PriceRow[]>) => {
    const rows = (await mirror).filter((row) => row.region === region);
    if (rows.length === 0) throw new Error(`PIHPS mirror ${region}: no prices`);
    logger.warn({ region, rows: rows.length }, "PIHPS mirror used");
    return ingestPrices(rows);
};

export const syncPihps = async ({ full = false, today = new Date() } = {}) => {
    const end = startOfDay(today);
    const failed: string[] = [];
    let mirror: Promise<PriceRow[]> | undefined;
    let total = 0;
    for (const region of Object.keys(PIHPS_PROVINCE)) {
        try {
            const start = await syncStart(region, full, today);
            const { kept, dropped } = dropSpikes(await fetchPihps(region, start, end), await referencePrices(region, start, full));
            for (const row of dropped) logger.warn({ ...row }, "PIHPS spike dropped");
            if (kept.length === 0) {
                logger.warn({ region, start: isoDate(start) }, "PIHPS returned no prices");
                continue;
            }
            await replaceWindow(region, start, kept);
            total += kept.length;
            logger.info({ region, rows: kept.length, dropped: dropped.length }, "PIHPS synced");
        } catch (error) {
            logger.error({ region, error: String(error) }, "PIHPS sync failed");
            try {
                total += await syncMirror(region, (mirror ??= fetchMirror()));
            } catch (mirrorError) {
                failed.push(region);
                logger.error({ region, error: String(mirrorError) }, "PIHPS mirror failed");
            }
        }
    }
    if (failed.length > 0) throw new Error(`PIHPS sync failed for: ${failed.join(", ")}`);
    return total;
};
