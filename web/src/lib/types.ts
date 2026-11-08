export enum Unit {
  Gram = "gram",
  Kg = "kg",
  Ons = "ons",
  Siung = "siung",
  Butir = "butir",
  Ikat = "ikat",
  Sdm = "sdm",
  Sdt = "sdt",
  Buah = "buah",
  Ml = "ml",
  Liter = "liter",
}

export enum Status {
  Safe = "safe",
  Warning = "warning",
  Loss = "loss",
}

export enum RiskLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum AlarmKind {
  MarginDrop = "margin_drop",
  PriceSurge = "price_surge",
}

export enum PriceSource {
  Nota = "nota",
  Community = "community",
  Pihps = "pihps",
  Manual = "manual",
}

export interface Commodity {
  id: string;
  name: string;
  emoji: string;
  priceUnit: string;
  basePrice: number;
  trend: number;
  volatility: number;
  seed: number;
  aliases: string[];
  unitOverrides?: Partial<Record<Unit, number>>;
}

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  qty: number;
  unit: Unit;
  commodityId: string | null;
  manualPricePerKg: number | null;
  needsCheck?: boolean;
}

export interface Menu {
  id: string;
  name: string;
  emoji: string;
  sellPrice: number;
  priceSetDay: number;
  targetMargin: number;
  threshold: number;
  extraCost: number;
  ingredients: Ingredient[];
  custom?: boolean;
}

export interface Substitute {
  altCommodityId: string | null;
  name: string;
  ratio: number;
  manualPricePerKg?: number;
  note: string;
}

export interface AlarmItem {
  id: string;
  kind: AlarmKind;
  title: string;
  detail: string;
  day: number;
  menuIds: string[];
  commodityId?: string;
  severity: Status;
  active: boolean;
}

export interface Nota {
  id: string;
  commodityId: string;
  pricePerKg: number;
  day: number;
  shared: boolean;
}

export interface PriceInfo {
  price: number;
  source: PriceSource;
  day: number;
}

export interface CommunityStats {
  median: number;
  count: number;
  dropped: number;
}
