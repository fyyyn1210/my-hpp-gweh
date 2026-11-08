import { Food, Unit } from "#src/utils/hpp.constant.js";

export interface CatalogCommodity {
    id: string;
    name: string;
    icon: Food;
    priceUnit: string;
    basePrice: number;
    trend: number;
    volatility: number;
    seed: number;
    aliases: string[];
    unitOverrides?: Partial<Record<Unit, number>>;
}

export interface SampleMenu {
    name: string;
    icon: Food;
    sellPrice: number;
    daysAgo: number;
    targetMargin: number;
    threshold: number;
    extraCost: number;
    ingredients: Array<{ name: string; icon: Food; qty: number; unit: Unit; commodityId: string | null; manualPricePerKg: number | null }>;
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

export const SAMPLE_MENUS: SampleMenu[] = [
    {
        name: "Ayam Geprek",
        icon: Food.Chicken,
        sellPrice: 19000,
        daysAgo: 90,
        targetMargin: 0.3,
        threshold: 0.2,
        extraCost: 1500,
        ingredients: [
            { name: "Daging ayam", icon: Food.Chicken, qty: 150, unit: Unit.Gram, commodityId: "ayam", manualPricePerKg: null },
            { name: "Cabai rawit", icon: Food.Chili, qty: 40, unit: Unit.Gram, commodityId: "cabai-rawit", manualPricePerKg: null },
            { name: "Bawang putih", icon: Food.Garlic, qty: 3, unit: Unit.Siung, commodityId: "bawang-putih", manualPricePerKg: null },
            { name: "Minyak goreng", icon: Food.Oil, qty: 80, unit: Unit.Ml, commodityId: "minyak", manualPricePerKg: null },
            { name: "Beras (nasi)", icon: Food.Rice, qty: 120, unit: Unit.Gram, commodityId: "beras", manualPricePerKg: null },
            { name: "Tepung bumbu", icon: Food.Flour, qty: 40, unit: Unit.Gram, commodityId: null, manualPricePerKg: 14000 },
        ],
    },
    {
        name: "Pecel Lele",
        icon: Food.Fish,
        sellPrice: 18000,
        daysAgo: 75,
        targetMargin: 0.3,
        threshold: 0.2,
        extraCost: 1500,
        ingredients: [
            { name: "Lele segar", icon: Food.Fish, qty: 180, unit: Unit.Gram, commodityId: null, manualPricePerKg: 32000 },
            { name: "Cabai rawit", icon: Food.Chili, qty: 30, unit: Unit.Gram, commodityId: "cabai-rawit", manualPricePerKg: null },
            { name: "Bawang merah", icon: Food.Onion, qty: 2, unit: Unit.Siung, commodityId: "bawang-merah", manualPricePerKg: null },
            { name: "Minyak goreng", icon: Food.Oil, qty: 100, unit: Unit.Ml, commodityId: "minyak", manualPricePerKg: null },
            { name: "Beras (nasi)", icon: Food.Rice, qty: 130, unit: Unit.Gram, commodityId: "beras", manualPricePerKg: null },
            { name: "Timun & lalapan", icon: Food.Cucumber, qty: 50, unit: Unit.Gram, commodityId: null, manualPricePerKg: 12000 },
        ],
    },
    {
        name: "Nasi Telur Balado",
        icon: Food.Egg,
        sellPrice: 15000,
        daysAgo: 60,
        targetMargin: 0.3,
        threshold: 0.2,
        extraCost: 1000,
        ingredients: [
            { name: "Telur ayam", icon: Food.Egg, qty: 2, unit: Unit.Butir, commodityId: "telur", manualPricePerKg: null },
            { name: "Cabai merah keriting", icon: Food.Pepper, qty: 50, unit: Unit.Gram, commodityId: "cabai-merah", manualPricePerKg: null },
            { name: "Bawang merah", icon: Food.Onion, qty: 3, unit: Unit.Siung, commodityId: "bawang-merah", manualPricePerKg: null },
            { name: "Minyak goreng", icon: Food.Oil, qty: 50, unit: Unit.Ml, commodityId: "minyak", manualPricePerKg: null },
            { name: "Beras (nasi)", icon: Food.Rice, qty: 130, unit: Unit.Gram, commodityId: "beras", manualPricePerKg: null },
        ],
    },
    {
        name: "Soto Ayam",
        icon: Food.Soup,
        sellPrice: 15000,
        daysAgo: 45,
        targetMargin: 0.3,
        threshold: 0.2,
        extraCost: 1500,
        ingredients: [
            { name: "Daging ayam", icon: Food.Chicken, qty: 100, unit: Unit.Gram, commodityId: "ayam", manualPricePerKg: null },
            { name: "Bawang putih", icon: Food.Garlic, qty: 2, unit: Unit.Siung, commodityId: "bawang-putih", manualPricePerKg: null },
            { name: "Bawang merah", icon: Food.Onion, qty: 3, unit: Unit.Siung, commodityId: "bawang-merah", manualPricePerKg: null },
            { name: "Telur ayam", icon: Food.Egg, qty: 1, unit: Unit.Butir, commodityId: "telur", manualPricePerKg: null },
            { name: "Beras (nasi)", icon: Food.Rice, qty: 120, unit: Unit.Gram, commodityId: "beras", manualPricePerKg: null },
        ],
    },
    {
        name: "Rawon Daging",
        icon: Food.Beef,
        sellPrice: 29500,
        daysAgo: 30,
        targetMargin: 0.3,
        threshold: 0.2,
        extraCost: 2000,
        ingredients: [
            { name: "Daging sapi", icon: Food.Beef, qty: 100, unit: Unit.Gram, commodityId: "sapi", manualPricePerKg: null },
            { name: "Bawang merah", icon: Food.Onion, qty: 4, unit: Unit.Siung, commodityId: "bawang-merah", manualPricePerKg: null },
            { name: "Bawang putih", icon: Food.Garlic, qty: 3, unit: Unit.Siung, commodityId: "bawang-putih", manualPricePerKg: null },
            { name: "Beras (nasi)", icon: Food.Rice, qty: 130, unit: Unit.Gram, commodityId: "beras", manualPricePerKg: null },
            { name: "Kluwek & bumbu", icon: Food.Nut, qty: 30, unit: Unit.Gram, commodityId: null, manualPricePerKg: 40000 },
        ],
    },
    {
        name: "Mie Goreng Telur",
        icon: Food.Noodles,
        sellPrice: 10000,
        daysAgo: 60,
        targetMargin: 0.3,
        threshold: 0.2,
        extraCost: 1500,
        ingredients: [
            { name: "Mie kering", icon: Food.Noodles, qty: 100, unit: Unit.Gram, commodityId: null, manualPricePerKg: 18000 },
            { name: "Telur ayam", icon: Food.Egg, qty: 1, unit: Unit.Butir, commodityId: "telur", manualPricePerKg: null },
            { name: "Bawang putih", icon: Food.Garlic, qty: 2, unit: Unit.Siung, commodityId: "bawang-putih", manualPricePerKg: null },
            { name: "Minyak goreng", icon: Food.Oil, qty: 40, unit: Unit.Ml, commodityId: "minyak", manualPricePerKg: null },
            { name: "Cabai merah keriting", icon: Food.Pepper, qty: 15, unit: Unit.Gram, commodityId: "cabai-merah", manualPricePerKg: null },
        ],
    },
];

export const SAMPLE_NOTAS = [
    { commodityId: "cabai-rawit", daysAgo: 1, ratio: 1.07, shared: true },
    { commodityId: "cabai-rawit", daysAgo: 9, ratio: 1.05, shared: true },
    { commodityId: "bawang-merah", daysAgo: 4, ratio: 0.95, shared: true },
    { commodityId: "minyak", daysAgo: 6, ratio: 1.04, shared: false },
    { commodityId: "ayam", daysAgo: 25, ratio: 1.08, shared: true },
];
