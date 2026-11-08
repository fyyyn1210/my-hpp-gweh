import { reactive } from "vue";
import type { Commodity } from "@/lib/types";

export const COMMODITIES = reactive<Commodity[]>([]);

export const COMMODITY_MAP = reactive<Record<string, Commodity>>({});

export const setCommodities = (items: Commodity[]) => {
  COMMODITIES.splice(0, COMMODITIES.length, ...items);
  for (const key of Object.keys(COMMODITY_MAP)) delete COMMODITY_MAP[key];
  for (const item of items) COMMODITY_MAP[item.id] = item;
};

export const commoditySeries = (commodity: Commodity): number[] => commodity.prices;
