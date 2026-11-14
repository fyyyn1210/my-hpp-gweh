import { logger } from "#src/configs/pino.config.js";
import { ingestPrices, type PriceRow } from "#src/modules/commodities/commodity.service.js";
import { median } from "#src/modules/hpp/hpp.engine.js";
import { MS_PER_DAY, startOfDay } from "#src/utils/date.util.js";
import { NATIONAL_REGION, PriceSource, TODAY } from "#src/utils/hpp.constant.js";
import {
    SP2KP_DELAY_MS,
    SP2KP_PACK_GRAMS,
    SP2KP_PAGE_SIZE,
    SP2KP_PRICE_URL,
    SP2KP_PROVINCE,
    SP2KP_PROVINCE_LEVEL,
    SP2KP_RESYNC_DAYS,
    SP2KP_TIMEOUT_MS,
    SP2KP_VARIANT,
} from "#src/utils/sp2kp.constant.js";

const VARIANT_COMMODITY = new Map(Object.entries(SP2KP_VARIANT).map(([commodityId, variant]) => [variant, commodityId]));

export const parseSp2kp = (body: unknown, region: string): PriceRow[] => {
    const data = (body as { data?: unknown } | null)?.data;
    if (!Array.isArray(data)) throw new Error(`SP2KP ${region}: response has no data array`);
    return data.flatMap((row: Record<string, unknown>) => {
        const commodityId = VARIANT_COMMODITY.get(Number(row.variant_id));
        const priceDate = new Date(`${String(row.tanggal)}T00:00:00Z`);
        if (!commodityId || Number.isNaN(priceDate.getTime())) return [];
        const price = Math.round((Number(row.harga) * 1000) / (SP2KP_PACK_GRAMS[commodityId] ?? 1000));
        return price > 0 ? [{ commodityId, source: PriceSource.Sp2kp, region, price, priceDate }] : [];
    });
};

export const nationalRows = (rows: PriceRow[]): PriceRow[] => {
    const groups = new Map<string, PriceRow[]>();
    for (const row of rows) {
        const key = `${row.commodityId}|${row.priceDate.getTime()}`;
        groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return [...groups.values()].map((group) => ({ ...group[0], region: NATIONAL_REGION, price: Math.round(median(group.map((row) => row.price))) }));
};

const fetchSp2kp = async (region: string, date: Date) => {
    const params = new URLSearchParams({
        level: String(SP2KP_PROVINCE_LEVEL),
        tanggal: date.toISOString().slice(0, 10),
        take: String(SP2KP_PAGE_SIZE),
        skip: "0",
        variant_id: "all",
        kode_provinsi: SP2KP_PROVINCE[region],
    });
    const res = await fetch(`${SP2KP_PRICE_URL}?${params}`, { signal: AbortSignal.timeout(SP2KP_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`SP2KP ${region}: HTTP ${res.status}`);
    return parseSp2kp(await res.json(), region);
};

const isWeekend = (date: Date) => date.getUTCDay() === 0 || date.getUTCDay() === 6;

export const syncSp2kp = async ({ full = false, today = new Date() } = {}) => {
    const end = startOfDay(today).getTime();
    const dates = Array.from({ length: full ? TODAY + 1 : SP2KP_RESYNC_DAYS }, (_, back) => new Date(end - back * MS_PER_DAY)).filter((date) => !isWeekend(date));
    const failed = new Set<string>();
    let total = 0;
    for (const date of dates) {
        const rows: PriceRow[] = [];
        for (const region of Object.keys(SP2KP_PROVINCE)) {
            try {
                rows.push(...(await fetchSp2kp(region, date)));
            } catch (error) {
                failed.add(region);
                logger.error({ region, date: date.toISOString(), error: String(error) }, "SP2KP sync failed");
            }
            await Bun.sleep(SP2KP_DELAY_MS);
        }
        total += await ingestPrices([...rows, ...nationalRows(rows)]);
        logger.info({ date: date.toISOString(), rows: rows.length }, "SP2KP synced");
    }
    if (failed.size > 0) throw new Error(`SP2KP sync failed for: ${[...failed].join(", ")}`);
    return total;
};
