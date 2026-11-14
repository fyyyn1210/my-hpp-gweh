import { Food, Unit } from "#src/utils/hpp.constant.js";

export interface CatalogItem {
    id: string;
    name: string;
    icon: Food;
    priceUnit: string;
    aliases: string[];
    unitOverrides?: Partial<Record<Unit, number>>;
    referencePrice?: number;
}

export interface CatalogCommodity extends CatalogItem {
    basePrice: number;
    trend: number;
    volatility: number;
    seed: number;
}

export const CATALOG: CatalogCommodity[] = [
    {
        id: "cabai-rawit",
        name: "Cabai rawit merah",
        icon: Food.Chili,
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
        icon: Food.Pepper,
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
        icon: Food.Onion,
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
        icon: Food.Garlic,
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
        icon: Food.Chicken,
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
        icon: Food.Egg,
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
        icon: Food.Beef,
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
        icon: Food.Rice,
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
        icon: Food.Oil,
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
        icon: Food.Sugar,
        priceUnit: "kg",
        basePrice: 17500,
        trend: -0.005,
        volatility: 0.005,
        seed: 101,
        aliases: ["gula pasir", "gula"],
    },
];

export const EXTRA_CATALOG: CatalogItem[] = [
    { id: "cabai-merah-besar", name: "Cabai merah besar", icon: Food.Pepper, priceUnit: "kg", aliases: ["cabai merah besar", "cabe merah besar", "cabai besar", "cabe besar"], unitOverrides: { [Unit.Butir]: 10, [Unit.Buah]: 10 } },
    { id: "cabai-rawit-hijau", name: "Cabai rawit hijau", icon: Food.Chili, priceUnit: "kg", aliases: ["cabai rawit hijau", "cabe rawit hijau", "rawit hijau"], unitOverrides: { [Unit.Butir]: 3, [Unit.Buah]: 3 } },
    { id: "beras-premium", name: "Beras premium", icon: Food.Rice, priceUnit: "kg", aliases: ["beras premium", "beras super"] },
    { id: "minyak-kemasan", name: "Minyak goreng kemasan", icon: Food.Oil, priceUnit: "liter", aliases: ["minyak goreng kemasan", "minyak kemasan", "bimoli", "sunco", "filma", "sania"] },
    { id: "gula-premium", name: "Gula pasir premium", icon: Food.Sugar, priceUnit: "kg", aliases: ["gula premium", "gula kemasan"] },
    { id: "minyakita", name: "Minyakita", icon: Food.Oil, priceUnit: "liter", aliases: ["minyakita"] },
    { id: "telur-kampung", name: "Telur ayam kampung", icon: Food.Egg, priceUnit: "kg", aliases: ["telur kampung", "telor kampung", "telur ayam kampung"], unitOverrides: { [Unit.Butir]: 45, [Unit.Buah]: 45 } },
    { id: "sapi-tetelan", name: "Daging sapi tetelan", icon: Food.Beef, priceUnit: "kg", aliases: ["daging sapi tetelan", "sapi tetelan", "tetelan"] },
    { id: "sapi-sandung-lamur", name: "Daging sapi sandung lamur", icon: Food.Beef, priceUnit: "kg", aliases: ["daging sapi sandung lamur", "sandung lamur", "lamur"] },
    { id: "tepung-terigu", name: "Tepung terigu", icon: Food.Flour, priceUnit: "kg", aliases: ["tepung terigu", "terigu", "tepung"] },
    { id: "jagung", name: "Jagung pipilan", icon: Food.Ingredient, priceUnit: "kg", aliases: ["jagung"] },
    { id: "kedelai", name: "Kedelai", icon: Food.Nut, priceUnit: "kg", aliases: ["kacang kedelai", "kedelai"] },
    { id: "tahu", name: "Tahu putih", icon: Food.Tofu, priceUnit: "kg", aliases: ["tahu"] },
    { id: "tempe", name: "Tempe", icon: Food.Tofu, priceUnit: "kg", aliases: ["tempe"] },
    { id: "mie-instan", name: "Mie instan", icon: Food.Noodles, priceUnit: "kg", aliases: ["mie instan", "mi instan", "indomie", "mie sedaap", "sarimi", "supermi"], unitOverrides: { [Unit.Buah]: 85 } },
    { id: "ikan-tongkol", name: "Ikan tongkol", icon: Food.Fish, priceUnit: "kg", aliases: ["ikan tongkol", "tongkol"] },
    { id: "ikan-teri", name: "Ikan teri", icon: Food.Fish, priceUnit: "kg", aliases: ["ikan teri", "teri"] },
    { id: "ikan-bandeng", name: "Ikan bandeng", icon: Food.Fish, priceUnit: "kg", aliases: ["ikan bandeng", "bandeng"] },
    { id: "ikan-kembung", name: "Ikan kembung", icon: Food.Fish, priceUnit: "kg", aliases: ["ikan kembung", "kembung"] },
    { id: "udang", name: "Udang basah", icon: Food.Fish, priceUnit: "kg", aliases: ["udang"] },
    { id: "garam", name: "Garam halus", icon: Food.Salt, priceUnit: "kg", aliases: ["garam"] },
    { id: "kacang-tanah", name: "Kacang tanah", icon: Food.Nut, priceUnit: "kg", aliases: ["kacang tanah"] },
    { id: "kacang-hijau", name: "Kacang hijau", icon: Food.Nut, priceUnit: "kg", aliases: ["kacang hijau"] },
    { id: "singkong", name: "Singkong", icon: Food.Ingredient, priceUnit: "kg", aliases: ["singkong", "ketela pohon", "ubi kayu"] },
    { id: "kentang", name: "Kentang", icon: Food.Ingredient, priceUnit: "kg", aliases: ["kentang"] },
    { id: "bawang-bombai", name: "Bawang bombai", icon: Food.Onion, priceUnit: "kg", aliases: ["bawang bombai", "bawang bombay", "bombay", "bombai"] },
    { id: "tomat", name: "Tomat", icon: Food.Salad, priceUnit: "kg", aliases: ["tomat"] },
    { id: "timun", name: "Timun", icon: Food.Cucumber, priceUnit: "kg", aliases: ["mentimun", "ketimun", "timun"] },
    { id: "sawi", name: "Sawi hijau", icon: Food.Salad, priceUnit: "kg", aliases: ["sawi hijau", "sawi", "caisim"] },
    { id: "kangkung", name: "Kangkung", icon: Food.Salad, priceUnit: "kg", aliases: ["kangkung"] },
    { id: "kacang-panjang", name: "Kacang panjang", icon: Food.Salad, priceUnit: "kg", aliases: ["kacang panjang"] },
    { id: "pisang", name: "Pisang", icon: Food.Ingredient, priceUnit: "kg", aliases: ["pisang"] },
    { id: "jeruk", name: "Jeruk lokal", icon: Food.Ingredient, priceUnit: "kg", aliases: ["jeruk lokal", "jeruk manis", "jeruk peras"] },
    { id: "kecap", name: "Kecap manis", icon: Food.Sauce, priceUnit: "kg", aliases: ["kecap"], referencePrice: 25000 },
    { id: "santan", name: "Santan", icon: Food.Coconut, priceUnit: "kg", aliases: ["santan"], referencePrice: 30000 },
    { id: "teh", name: "Teh", icon: Food.Tea, priceUnit: "kg", aliases: ["teh"], referencePrice: 80000 },
];

export const FULL_CATALOG: CatalogItem[] = [...CATALOG, ...EXTRA_CATALOG];

