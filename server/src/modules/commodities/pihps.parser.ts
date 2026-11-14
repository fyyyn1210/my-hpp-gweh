import type { PriceRow } from "#src/modules/commodities/commodity.service.js";
import { median } from "#src/modules/hpp/hpp.engine.js";
import { NATIONAL_REGION, PriceSource } from "#src/utils/hpp.constant.js";
import { PIHPS_COMMODITY, SPIKE_LIMIT } from "#src/utils/pihps.constant.js";

const PIHPS_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const PIHPS_NAMES = new Map(Object.entries(PIHPS_COMMODITY).map(([id, item]) => [item.name, id]));

export const parsePihps = (body: unknown, region: string): PriceRow[] => {
    const data = (body as { data?: unknown } | null)?.data;
    if (!Array.isArray(data)) throw new Error(`PIHPS ${region}: response has no data array`);
    return data
        .filter((row: Record<string, unknown>) => row.level === 2)
        .flatMap((row: Record<string, unknown>) => {
            const name = String(row.name).trim();
            const commodityId = PIHPS_NAMES.get(name);
            if (!commodityId) throw new Error(`PIHPS ${region}: unknown commodity "${name}"`);
            return Object.entries(row).flatMap(([key, value]) => {
                const date = key.match(PIHPS_DATE);
                const price = Number(String(value).replace(/,/g, ""));
                if (!date || !(price > 0)) return [];
                const priceDate = new Date(Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1])));
                return [{ commodityId, source: PriceSource.Pihps, region, price, priceDate }];
            });
        });
};

export const parsePihpsMirror = (body: unknown, commodityId: string, regions: string[]): PriceRow[] => {
    const { tanggal, data } = (body ?? {}) as { tanggal?: string; data?: Array<{ harga?: Array<{ wilayah?: { level?: string; nama?: string }; harga?: number }> }> };
    const priceDate = new Date(`${tanggal}T00:00:00Z`);
    if (!Array.isArray(data) || Number.isNaN(priceDate.getTime())) throw new Error(`PIHPS mirror ${commodityId}: unexpected response`);
    const provinces = (data[0]?.harga ?? []).filter((item) => item.wilayah?.level === "provinsi" && Number(item.harga) > 0);
    const national = provinces.length ? [{ region: NATIONAL_REGION, price: median(provinces.map((item) => Number(item.harga))) }] : [];
    return [...national, ...provinces.map((item) => ({ region: String(item.wilayah?.nama), price: Number(item.harga) }))]
        .filter((item) => regions.includes(item.region))
        .map((item) => ({ commodityId, source: PriceSource.Pihps, region: item.region, price: Math.round(item.price), priceDate }));
};

const rowKey = (row: PriceRow) => `${row.commodityId}|${row.region}`;
const jumped = (price: number, reference: number) => Math.abs(price / reference - 1) > SPIKE_LIMIT;

export const dropSpikes = (rows: PriceRow[], reference: Map<string, number>) => {
    const groups = new Map<string, PriceRow[]>();
    for (const row of [...rows].sort((a, b) => a.priceDate.getTime() - b.priceDate.getTime())) {
        groups.set(rowKey(row), [...(groups.get(rowKey(row)) ?? []), row]);
    }
    const kept: PriceRow[] = [];
    const dropped: PriceRow[] = [];
    for (const [key, group] of groups) {
        let last = reference.get(key);
        group.forEach((row, index) => {
            const next = group[index + 1];
            if (last !== undefined && jumped(row.price, last) && !(next && jumped(next.price, last))) return dropped.push(row);
            kept.push(row);
            last = row.price;
        });
    }
    return { kept, dropped };
};
