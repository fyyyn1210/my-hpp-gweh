import { Unit } from "./types";

export const DAYS = 120;
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
export const STORAGE_KEY = "hpp-pintar-state-v2";
export const EXPLAIN_DELAY_MS = 900;
export const SUGGEST_IDLE_MS = 3000;
export const SUGGEST_MAX_WORDS = 3;
export const PARSE_DELAY_MS = 700;
export const NOTA_MAX_AGE = 14;
export const COMMUNITY_WINDOW = 7;
export const COMMUNITY_MIN = 3;
export const OUTLIER_LOW = 0.5;
export const OUTLIER_HIGH = 2;
export const CATERING_PERCENTILE = 0.9;
export const PORTION_CHOICES = [50, 100, 200, 500];
export const MARGIN_CHOICES = [0.15, 0.2, 0.25, 0.3, 0.35, 0.4];
export const RANGE_CHOICES = [7, 30, 90];
export const PORTION_CUT_LIMIT = 0.25;
export const CITIES = ["Surabaya", "Jakarta Pusat", "Bandung", "Semarang", "Yogyakarta", "Malang", "Medan", "Makassar", "Denpasar"];
export const BUY_UNITS = [
  { key: "kg", label: "kg", perKg: 1 },
  { key: "ons", label: "ons", perKg: 0.1 },
  { key: "gram", label: "gram", perKg: 0.001 },
  { key: "liter", label: "liter", perKg: 1 },
];

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
