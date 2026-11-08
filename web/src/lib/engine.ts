import { COMMODITY_MAP } from "@/data/commodities";
import { SUBSTITUTES } from "@/data/substitutes";
import {
  MANUAL_PRICE_HINTS,
  RISK_HIGH,
  RISK_MEDIUM,
  SUBSTITUTE_TRIGGER,
  TODAY,
  UNIT_ALIASES,
  UNIT_GRAMS,
  WEEK,
} from "./constants";
import { clamp, percent, rupiah, uid } from "./format";
import {
  RiskLevel,
  Status,
  Unit,
  type Commodity,
  type Ingredient,
  type Menu,
  type Substitute,
} from "./types";

const seriesCache = new Map<string, number[]>();

export const commoditySeries = (commodity: Commodity): number[] => {
  const cached = seriesCache.get(commodity.id);
  if (cached) return cached;
  const length = TODAY + 1;
  const values = Array.from({ length }, (_, day) => {
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

export const commodityPrice = (commodity: Commodity, day = TODAY) =>
  commoditySeries(commodity)[clamp(day, 0, TODAY)] * commodity.calibration;

export const commodityChange = (commodity: Commodity, fromDay: number, toDay = TODAY) => {
  const from = commodityPrice(commodity, fromDay);
  const to = commodityPrice(commodity, toDay);
  return from === 0 ? 0 : (to - from) / from;
};

export const gramsOf = (ingredient: Ingredient): number => {
  const commodity = ingredient.commodityId ? COMMODITY_MAP[ingredient.commodityId] : null;
  const override = commodity?.unitOverrides?.[ingredient.unit];
  const gramsPerUnit = override ?? UNIT_GRAMS[ingredient.unit];
  return ingredient.qty * gramsPerUnit;
};

export const ingredientPricePerKg = (ingredient: Ingredient, day = TODAY): number => {
  if (ingredient.commodityId) {
    const commodity = COMMODITY_MAP[ingredient.commodityId];
    if (commodity) return commodityPrice(commodity, day);
  }
  return ingredient.manualPricePerKg ?? 0;
};

export const ingredientCost = (ingredient: Ingredient, day = TODAY) =>
  (gramsOf(ingredient) / 1000) * ingredientPricePerKg(ingredient, day);

export const hpp = (menu: Menu, day = TODAY) =>
  menu.ingredients.reduce((sum, ingredient) => sum + ingredientCost(ingredient, day), 0) + menu.extraCost;

export const marginOf = (sellPrice: number, cost: number) =>
  sellPrice <= 0 ? 0 : (sellPrice - cost) / sellPrice;

export const menuMargin = (menu: Menu, day = TODAY) => marginOf(menu.sellPrice, hpp(menu, day));

export const statusOf = (menu: Menu, day = TODAY): Status => {
  const margin = menuMargin(menu, day);
  if (margin < 0) return Status.Loss;
  if (margin < menu.threshold) return Status.Warning;
  return Status.Safe;
};

export const hppSeries = (menu: Menu) => Array.from({ length: TODAY + 1 }, (_, day) => hpp(menu, day));

export const hppChange = (menu: Menu, fromDay: number) => {
  const from = hpp(menu, fromDay);
  return from === 0 ? 0 : (hpp(menu, TODAY) - from) / from;
};

export const suggestPrice = (cost: number, targetMargin: number, step: number) => {
  const safeMargin = clamp(targetMargin, 0, 0.95);
  const raw = cost / (1 - safeMargin);
  const rounded = Math.ceil(raw / step) * step;
  return { raw, rounded, actualMargin: marginOf(rounded, cost) };
};

export interface Contributor {
  ingredient: Ingredient;
  before: number;
  after: number;
  delta: number;
  changePct: number;
}

export const contributors = (menu: Menu, fromDay: number): Contributor[] =>
  menu.ingredients
    .map((ingredient) => {
      const before = ingredientCost(ingredient, fromDay);
      const after = ingredientCost(ingredient, TODAY);
      return {
        ingredient,
        before,
        after,
        delta: after - before,
        changePct: before === 0 ? 0 : (after - before) / before,
      };
    })
    .sort((a, b) => b.delta - a.delta);

const monthlyVolatility = (commodity: Commodity) => {
  const series = commoditySeries(commodity);
  const returns = series.slice(1).map((price, index) => (price - series[index]) / series[index]);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  const rise = Math.max(0, commodityChange(commodity, 0));
  return Math.max(Math.sqrt(variance) * Math.sqrt(WEEK) * 2, rise * 0.5);
};

export interface Vulnerability {
  score: number;
  level: RiskLevel;
  topCommodity: Commodity | null;
  topShare: number;
  marginDropIfRise: number;
  action: string;
}

export const vulnerability = (menu: Menu): Vulnerability => {
  const margin = menuMargin(menu);
  let drop = 0;
  let top: { commodity: Commodity; weight: number } | null = null;
  let topShare = 0;
  const cost = hpp(menu);
  for (const ingredient of menu.ingredients) {
    if (!ingredient.commodityId) continue;
    const commodity = COMMODITY_MAP[ingredient.commodityId];
    if (!commodity) continue;
    const weight = (ingredientCost(ingredient) / menu.sellPrice) * monthlyVolatility(commodity);
    drop += weight;
    if (!top || weight > top.weight) {
      top = { commodity, weight };
      topShare = cost === 0 ? 0 : ingredientCost(ingredient) / cost;
    }
  }
  const headroom = Math.max(margin - menu.threshold, 0.015);
  const score =
    margin < 0
      ? 100
      : margin < menu.threshold
        ? Math.round(70 + clamp(drop * 300, 0, 25))
        : Math.round(clamp((drop / headroom) * 55, 0, 69));
  const level = score >= RISK_HIGH ? RiskLevel.High : score >= RISK_MEDIUM ? RiskLevel.Medium : RiskLevel.Low;
  const name = top ? top.commodity.name.toLowerCase() : "bahan utama";
  const action =
    level === RiskLevel.High
      ? `Naikkan harga jual atau cari pengganti ${name} sekarang.`
      : level === RiskLevel.Medium
        ? `Pantau harga ${name}. Siapkan harga jual baru.`
        : "Aman untuk saat ini. Tidak perlu tindakan.";
  return { score, level, topCommodity: top?.commodity ?? null, topShare, marginDropIfRise: drop, action };
};

export const explanation = (menu: Menu): string => {
  const list = contributors(menu, TODAY - WEEK).filter((item) => item.delta > 0);
  const oldMargin = menuMargin(menu, TODAY - WEEK);
  const newMargin = menuMargin(menu);
  const oldCost = hpp(menu, TODAY - WEEK);
  const newCost = hpp(menu);
  if (list.length === 0 || newCost <= oldCost) {
    return `Dalam 7 hari terakhir modal ${menu.name} tidak naik (${rupiah(oldCost)} menjadi ${rupiah(newCost)} per porsi). Margin Anda stabil di ${percent(newMargin, 1)}.`;
  }
  const first = list[0];
  const second = list[1];
  const parts = [
    `Modal ${menu.name} naik dari ${rupiah(oldCost)} menjadi ${rupiah(newCost)} per porsi dalam 7 hari terakhir, sehingga margin turun dari ${percent(oldMargin, 1)} ke ${percent(newMargin, 1)}.`,
    `Penyebab terbesar: ${first.ingredient.name.toLowerCase()} naik ${percent(first.changePct, 0)} (tambahan ${rupiah(first.delta)} per porsi).`,
  ];
  if (second && second.delta > 0) {
    parts.push(
      `Disusul ${second.ingredient.name.toLowerCase()} yang naik ${percent(second.changePct, 0)} (tambahan ${rupiah(second.delta)}).`,
    );
  }
  return parts.join(" ");
};

export interface SubstituteResult {
  substitute: Substitute;
  newCost: number;
  saving: number;
  newMargin: number;
  computable: boolean;
}

export const substituteTarget = (menu: Menu): Ingredient | null => {
  const candidates = menu.ingredients
    .filter((ingredient) => ingredient.commodityId && SUBSTITUTES[ingredient.commodityId])
    .map((ingredient) => ({
      ingredient,
      change: commodityChange(COMMODITY_MAP[ingredient.commodityId as string], TODAY - WEEK),
    }))
    .filter((item) => item.change >= SUBSTITUTE_TRIGGER)
    .sort((a, b) => b.change - a.change);
  return candidates[0]?.ingredient ?? null;
};

export const substituteOptions = (menu: Menu, ingredient: Ingredient): SubstituteResult[] => {
  if (!ingredient.commodityId) return [];
  const currentCost = hpp(menu);
  const baseCost = ingredientCost(ingredient);
  const grams = gramsOf(ingredient);
  return (SUBSTITUTES[ingredient.commodityId] ?? []).map((substitute) => {
    const pricePerKg = substitute.altCommodityId
      ? commodityPrice(COMMODITY_MAP[substitute.altCommodityId])
      : substitute.manualPricePerKg;
    if (pricePerKg === undefined || pricePerKg === null) {
      return { substitute, newCost: currentCost, saving: 0, newMargin: menuMargin(menu), computable: false };
    }
    const altCost = (grams * substitute.ratio / 1000) * pricePerKg;
    const newCost = currentCost - baseCost + altCost;
    return {
      substitute,
      newCost,
      saving: currentCost - newCost,
      newMargin: marginOf(menu.sellPrice, newCost),
      computable: true,
    };
  });
};

export interface ParsedIngredient extends Ingredient {
  needsCheck: boolean;
}

const findCommodity = (name: string): Commodity | null => {
  const lowered = name.toLowerCase();
  let best: { commodity: Commodity; length: number } | null = null;
  for (const commodity of Object.values(COMMODITY_MAP)) {
    for (const alias of commodity.aliases) {
      if (lowered.includes(alias) && (!best || alias.length > best.length)) {
        best = { commodity, length: alias.length };
      }
    }
  }
  return best?.commodity ?? null;
};

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, setengah: 0.5 };

const parseQty = (raw: string): number | null => {
  const text = raw.trim().toLowerCase().replace(",", ".");
  if (FRACTIONS[text] !== undefined) return FRACTIONS[text];
  const mixed = text.match(/^(\d+)\s*(½|¼|¾)$/);
  if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const number = Number(text);
  return Number.isFinite(number) && text !== "" ? number : null;
};

export const parseRecipeText = (text: string): ParsedIngredient[] => {
  const lines = text
    .split(/\n|;|,(?=\s*\d)/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+(?=\D)/, (match) => (/\d/.test(match) ? match : "")).trim())
    .filter(Boolean);
  const result: ParsedIngredient[] = [];
  for (const line of lines) {
    const match = line.match(/^(\d+(?:[.,]\d+)?(?:\s*[½¼¾]|\/\d+)?|½|¼|¾|setengah)\s*([a-zA-Z]+)?\s+(.+)$/i);
    let qty: number | null = null;
    let unit: Unit = Unit.Gram;
    let name = line;
    let needsCheck = false;
    if (match) {
      qty = parseQty(match[1]);
      const unitWord = (match[2] ?? "").toLowerCase();
      if (unitWord && UNIT_ALIASES[unitWord]) {
        unit = UNIT_ALIASES[unitWord];
        name = match[3];
      } else {
        unit = Unit.Buah;
        name = `${match[2] ?? ""} ${match[3]}`.trim();
        needsCheck = true;
      }
    } else {
      needsCheck = true;
      qty = 1;
      unit = Unit.Sdm;
    }
    if (qty === null) {
      qty = 1;
      needsCheck = true;
    }
    name = name.replace(/\s+/g, " ").trim();
    const commodity = findCommodity(name);
    const hintKey = Object.keys(MANUAL_PRICE_HINTS).find((key) => name.toLowerCase().includes(key));
    const hint = hintKey ? MANUAL_PRICE_HINTS[hintKey] : null;
    result.push({
      id: uid("ing"),
      name: commodity ? commodity.name : hint ? hint.name : name.charAt(0).toUpperCase() + name.slice(1),
      emoji: commodity ? commodity.emoji : hint ? hint.emoji : "🥣",
      qty,
      unit,
      commodityId: commodity ? commodity.id : null,
      manualPricePerKg: commodity ? null : hint ? hint.pricePerKg : null,
      needsCheck: needsCheck || (!commodity && !hint),
    });
  }
  return result;
};

export const SAMPLE_RECIPE = `150 gram daging ayam
5 ons beras
3 siung bawang putih
2 butir telur
1/2 ons cabe kriting
2 sdm kecap manis
3 sdm minyak goreng`;
