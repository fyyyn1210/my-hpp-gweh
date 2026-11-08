import { COMMODITY_MAP, commoditySeries } from "@/data/commodities";
import { SUBSTITUTES } from "@/data/substitutes";
import {
  CATERING_PERCENTILE,
  COMMUNITY_MIN,
  COMMUNITY_WINDOW,
  NOTA_MAX_AGE,
  OUTLIER_HIGH,
  OUTLIER_LOW,
  RISK_HIGH,
  RISK_MEDIUM,
  SUBSTITUTE_TRIGGER,
  TODAY,
  UNIT_GRAMS,
  WEEK,
} from "./constants";
import { clamp, dayLabel, percent, rupiah } from "./format";
import { state } from "./state";
import {
  PriceSource,
  RiskLevel,
  Status,
  type Commodity,
  type CommunityStats,
  type PriceInfo,
  type Ingredient,
  type Menu,
  type Substitute,
} from "./types";

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))] ?? 0;
};

export const pihpsPrice = (commodity: Commodity, day = TODAY) => commoditySeries(commodity)[clamp(day, 0, TODAY)];

export const calibrationOf = (commodity: Commodity) => {
  const ratios = state.notas
    .filter((nota) => nota.commodityId === commodity.id)
    .map((nota) => nota.pricePerKg / pihpsPrice(commodity, nota.day));
  return ratios.length ? median(ratios) : 1;
};

export const latestNota = (commodityId: string, day = TODAY) =>
  state.notas
    .filter((nota) => nota.commodityId === commodityId && nota.day <= day && day - nota.day <= NOTA_MAX_AGE)
    .sort((a, b) => b.day - a.day)[0] ?? null;

export const communityStats = (commodity: Commodity, day = TODAY): CommunityStats | null => {
  const votes = state.votes
    .filter((vote) => vote.commodityId === commodity.id && vote.day <= day && day - vote.day < COMMUNITY_WINDOW)
    .map((vote) => vote.pricePerKg);
  if (state.shareCommunity) {
    const own = state.notas
      .filter((nota) => nota.shared && nota.commodityId === commodity.id && nota.day <= day && day - nota.day < COMMUNITY_WINDOW)
      .sort((a, b) => b.day - a.day)[0];
    if (own) votes.push(own.pricePerKg);
  }
  const reference = pihpsPrice(commodity, day);
  const kept = votes.filter((price) => price >= reference * OUTLIER_LOW && price <= reference * OUTLIER_HIGH);
  if (kept.length < COMMUNITY_MIN) return null;
  return { median: median(kept), count: kept.length, dropped: votes.length - kept.length };
};

export const priceInfo = (commodity: Commodity, day = TODAY): PriceInfo => {
  const nota = latestNota(commodity.id, day);
  if (nota) return { price: nota.pricePerKg, source: PriceSource.Nota, day: nota.day };
  const community = communityStats(commodity, day);
  if (community) return { price: community.median, source: PriceSource.Community, day };
  return { price: pihpsPrice(commodity, day) * calibrationOf(commodity), source: PriceSource.Pihps, day };
};

export const commodityPrice = (commodity: Commodity, day = TODAY) => priceInfo(commodity, day).price;

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

export const ingredientPriceInfo = (ingredient: Ingredient, day = TODAY): PriceInfo => {
  const commodity = ingredient.commodityId ? COMMODITY_MAP[ingredient.commodityId] : null;
  if (commodity) return priceInfo(commodity, day);
  return { price: ingredient.manualPricePerKg ?? 0, source: PriceSource.Manual, day };
};

export const ingredientPricePerKg = (ingredient: Ingredient, day = TODAY) => ingredientPriceInfo(ingredient, day).price;

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

export const hppSeries = (menu: Menu, days: number) =>
  Array.from({ length: days }, (_, index) => hpp(menu, TODAY + 1 - days + index));

export const erosion = (menu: Menu) => menuMargin(menu, menu.priceSetDay) - menuMargin(menu);

export const portionCut = (menu: Menu) => {
  const ingredientsCost = hpp(menu) - menu.extraCost;
  const allowed = menu.sellPrice * (1 - menu.targetMargin) - menu.extraCost;
  return ingredientsCost <= 0 ? 0 : clamp(1 - allowed / ingredientsCost, 0, 1);
};

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
  const series = commoditySeries(commodity).slice(-30);
  const returns = series.slice(1).map((price, index) => (price - series[index]) / series[index]);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  const rise = Math.max(0, commodityChange(commodity, TODAY - 29));
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
  const since = menu.priceSetDay;
  const list = contributors(menu, since).filter((item) => item.delta > 0);
  const oldMargin = menuMargin(menu, since);
  const newMargin = menuMargin(menu);
  const oldCost = hpp(menu, since);
  const newCost = hpp(menu);
  const when = `sejak harga jual ${rupiah(menu.sellPrice)} ditetapkan ${dayLabel(since)}`;
  if (list.length === 0 || newCost <= oldCost) {
    return `Modal ${menu.name} tidak naik ${when} (${rupiah(oldCost)} menjadi ${rupiah(newCost)} per porsi). Untung Anda stabil di ${percent(newMargin, 0)}.`;
  }
  const first = list[0];
  const second = list[1];
  const parts = [
    `Modal ${menu.name} naik dari ${rupiah(oldCost)} menjadi ${rupiah(newCost)} per porsi ${when}, sehingga untung turun dari ${percent(oldMargin, 0)} ke ${percent(newMargin, 0)}.`,
    `Penyebab terbesar: ${first.ingredient.name.toLowerCase()} naik ${percent(first.changePct, 0)} (tambahan ${rupiah(first.delta)} per porsi).`,
  ];
  if (second && second.delta > 0) {
    parts.push(`Disusul ${second.ingredient.name.toLowerCase()} yang naik ${percent(second.changePct, 0)} (tambahan ${rupiah(second.delta)}).`);
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

export const riseBuffer = (commodity: Commodity, days: number) => {
  const series = commoditySeries(commodity);
  const span = clamp(days, 1, TODAY - 1);
  const rises: number[] = [];
  for (let day = 0; day + span <= TODAY; day++) rises.push(Math.max(0, (series[day + span] - series[day]) / series[day]));
  return percentile(rises, CATERING_PERCENTILE);
};

export const cateringQuote = (menu: Menu, portions: number, daysAhead: number, targetMargin: number, step: number) => {
  const lines = menu.ingredients
    .map((ingredient) => {
      const cost = ingredientCost(ingredient);
      const buffer = ingredient.commodityId ? riseBuffer(COMMODITY_MAP[ingredient.commodityId], daysAhead) : 0;
      return { ingredient, cost, buffer, risk: cost * buffer };
    })
    .sort((a, b) => b.risk - a.risk);
  const base = hpp(menu);
  const projected = base + lines.reduce((sum, line) => sum + line.risk, 0);
  const plain = suggestPrice(base, targetMargin, step);
  const buffered = suggestPrice(projected, targetMargin, step);
  return {
    lines,
    base,
    projected,
    plain,
    buffered,
    totalPlain: plain.rounded * portions,
    totalBuffered: buffered.rounded * portions,
    profit: (buffered.rounded - projected) * portions,
  };
};

export const findCommodity = (name: string): Commodity | null => {
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

export const SAMPLE_RECIPE = `150 gram daging ayam
5 ons beras
3 siung bawang putih
2 butir telur
1/2 ons cabe kriting
2 sdm kecap manis
3 sdm minyak goreng`;

export const marginSteps = (sellPrice: number, cost: number) =>
  `(${rupiah(sellPrice)} − ${rupiah(cost)}) ÷ ${rupiah(sellPrice)} = ${percent(marginOf(sellPrice, cost), 0)}`;
