import { TODAY } from "@/lib/constants";
import { Unit, type Commodity } from "@/lib/types";

export const COMMODITIES: Commodity[] = [
  {
    id: "cabai-rawit",
    name: "Cabai rawit merah",
    emoji: "🌶️",
    priceUnit: "kg",
    basePrice: 42000,
    trend: 0.95,
    volatility: 0.035,
    seed: 11,
    aliases: ["cabe rawit", "cabai rawit", "rawit"],
    unitOverrides: { [Unit.Butir]: 3, [Unit.Buah]: 3 },
  },
  {
    id: "cabai-merah",
    name: "Cabai merah keriting",
    emoji: "🫑",
    priceUnit: "kg",
    basePrice: 40000,
    trend: 0.45,
    volatility: 0.028,
    seed: 23,
    aliases: ["cabe merah", "cabai merah", "cabe kriting", "cabai keriting", "cabe keriting", "cabai kriting"],
    unitOverrides: { [Unit.Butir]: 8, [Unit.Buah]: 8 },
  },
  {
    id: "bawang-merah",
    name: "Bawang merah",
    emoji: "🧅",
    priceUnit: "kg",
    basePrice: 33000,
    trend: 0.25,
    volatility: 0.02,
    seed: 37,
    aliases: ["bawang merah", "bawang abang"],
    unitOverrides: { [Unit.Siung]: 10, [Unit.Butir]: 10, [Unit.Buah]: 10 },
  },
  {
    id: "bawang-putih",
    name: "Bawang putih",
    emoji: "🧄",
    priceUnit: "kg",
    basePrice: 36000,
    trend: -0.04,
    volatility: 0.012,
    seed: 41,
    aliases: ["bawang putih", "bawang puti"],
  },
  {
    id: "ayam",
    name: "Daging ayam ras",
    emoji: "🍗",
    priceUnit: "kg",
    basePrice: 38000,
    trend: 0.06,
    volatility: 0.012,
    seed: 53,
    aliases: ["daging ayam", "dada ayam", "paha ayam", "ayam"],
  },
  {
    id: "telur",
    name: "Telur ayam ras",
    emoji: "🥚",
    priceUnit: "kg",
    basePrice: 30000,
    trend: 0.05,
    volatility: 0.012,
    seed: 67,
    aliases: ["telur", "telor"],
  },
  {
    id: "sapi",
    name: "Daging sapi",
    emoji: "🥩",
    priceUnit: "kg",
    basePrice: 135000,
    trend: 0.015,
    volatility: 0.006,
    seed: 71,
    aliases: ["daging sapi", "sapi"],
  },
  {
    id: "beras",
    name: "Beras medium",
    emoji: "🍚",
    priceUnit: "kg",
    basePrice: 14000,
    trend: 0.012,
    volatility: 0.004,
    seed: 83,
    aliases: ["beras"],
  },
  {
    id: "minyak",
    name: "Minyak goreng",
    emoji: "🛢️",
    priceUnit: "liter",
    basePrice: 19000,
    trend: 0.02,
    volatility: 0.006,
    seed: 97,
    aliases: ["minyak goreng", "minyak"],
  },
  {
    id: "gula",
    name: "Gula pasir",
    emoji: "🍬",
    priceUnit: "kg",
    basePrice: 17500,
    trend: -0.005,
    volatility: 0.005,
    seed: 101,
    aliases: ["gula pasir", "gula"],
  },
];

export const COMMODITY_MAP: Record<string, Commodity> = Object.fromEntries(
  COMMODITIES.map((commodity) => [commodity.id, commodity]),
);

const seriesCache = new Map<string, number[]>();

export const commoditySeries = (commodity: Commodity): number[] => {
  const cached = seriesCache.get(commodity.id);
  if (cached) return cached;
  const values = Array.from({ length: TODAY + 1 }, (_, day) => {
    const progress = Math.pow(day / TODAY, 2.2);
    const wave =
      Math.sin(day * 0.9 + commodity.seed) * commodity.volatility +
      Math.sin(day * 0.37 + commodity.seed * 2) * commodity.volatility * 0.6;
    const price = commodity.basePrice * (1 + commodity.trend * progress) * (1 + wave);
    return Math.round(price / 50) * 50;
  });
  seriesCache.set(commodity.id, values);
  return values;
};
