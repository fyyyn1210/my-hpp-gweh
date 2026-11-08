import { Unit } from "./types";

export const DAYS = 30;
export const TODAY = DAYS - 1;
export const WEEK = 7;
export const MS_PER_DAY = 86_400_000;

export const SURGE_THRESHOLD = 0.1;
export const SUBSTITUTE_TRIGGER = 0.08;
export const RISK_HIGH = 66;
export const RISK_MEDIUM = 33;
export const DEFAULT_TARGET_MARGIN = 0.25;
export const DEFAULT_THRESHOLD = 0.2;
export const DEFAULT_EXTRA_COST = 1000;
export const ROUNDING_STEPS = [500, 1000];
export const STORAGE_KEY = "hpp-pintar-state-v1";
export const EXPLAIN_DELAY_MS = 900;
export const PARSE_DELAY_MS = 700;

export const UNIT_GRAMS: Record<Unit, number> = {
  [Unit.Gram]: 1,
  [Unit.Kg]: 1000,
  [Unit.Ons]: 100,
  [Unit.Siung]: 5,
  [Unit.Butir]: 60,
  [Unit.Ikat]: 250,
  [Unit.Sdm]: 12,
  [Unit.Sdt]: 4,
  [Unit.Buah]: 100,
  [Unit.Ml]: 1,
  [Unit.Liter]: 1000,
};

export const UNIT_LABELS: Record<Unit, string> = {
  [Unit.Gram]: "gram",
  [Unit.Kg]: "kg",
  [Unit.Ons]: "ons (100 g)",
  [Unit.Siung]: "siung",
  [Unit.Butir]: "butir / biji",
  [Unit.Ikat]: "ikat",
  [Unit.Sdm]: "sendok makan",
  [Unit.Sdt]: "sendok teh",
  [Unit.Buah]: "buah",
  [Unit.Ml]: "ml",
  [Unit.Liter]: "liter",
};

export const UNIT_SHORT: Record<Unit, string> = {
  [Unit.Gram]: "g",
  [Unit.Kg]: "kg",
  [Unit.Ons]: "ons",
  [Unit.Siung]: "siung",
  [Unit.Butir]: "butir",
  [Unit.Ikat]: "ikat",
  [Unit.Sdm]: "sdm",
  [Unit.Sdt]: "sdt",
  [Unit.Buah]: "buah",
  [Unit.Ml]: "ml",
  [Unit.Liter]: "liter",
};

export const UNIT_ALIASES: Record<string, Unit> = {
  g: Unit.Gram,
  gr: Unit.Gram,
  gram: Unit.Gram,
  kg: Unit.Kg,
  kilo: Unit.Kg,
  kilogram: Unit.Kg,
  ons: Unit.Ons,
  siung: Unit.Siung,
  butir: Unit.Butir,
  biji: Unit.Butir,
  btr: Unit.Butir,
  ikat: Unit.Ikat,
  sdm: Unit.Sdm,
  sdt: Unit.Sdt,
  buah: Unit.Buah,
  bh: Unit.Buah,
  ml: Unit.Ml,
  liter: Unit.Liter,
  l: Unit.Liter,
};

export const MANUAL_PRICE_HINTS: Record<string, { name: string; emoji: string; pricePerKg: number }> = {
  tempe: { name: "Tempe", emoji: "🟫", pricePerKg: 20000 },
  tahu: { name: "Tahu", emoji: "⬜", pricePerKg: 15000 },
  kecap: { name: "Kecap manis", emoji: "🍶", pricePerKg: 25000 },
  tepung: { name: "Tepung terigu", emoji: "🌾", pricePerKg: 14000 },
  timun: { name: "Timun", emoji: "🥒", pricePerKg: 12000 },
  garam: { name: "Garam", emoji: "🧂", pricePerKg: 8000 },
  teh: { name: "Teh", emoji: "🍵", pricePerKg: 80000 },
  santan: { name: "Santan", emoji: "🥥", pricePerKg: 30000 },
  nasi: { name: "Nasi", emoji: "🍚", pricePerKg: 5000 },
};
