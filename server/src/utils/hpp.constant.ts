export const DAYS = 120;
export const TODAY = DAYS - 1;
export const WEEK = 7;

export const SURGE_THRESHOLD = 0.1;
export const SURGE_LOSS = 0.2;
export const NOTA_MAX_AGE = 14;
export const COMMUNITY_WINDOW = 7;
export const COMMUNITY_MIN = 3;
export const OUTLIER_LOW = 0.5;
export const OUTLIER_HIGH = 2;
export const PASSWORD_MIN = 6;
export const CITIES = ["Surabaya", "Jakarta Pusat", "Bandung", "Semarang", "Yogyakarta", "Malang", "Medan", "Makassar", "Denpasar"];
export const ROUNDING_STEPS = [500, 1000];
export const NATIONAL_REGION = "national";
export const CITY_PROVINCE: Record<string, string> = {
    Surabaya: "Jawa Timur",
    "Jakarta Pusat": "DKI Jakarta",
    Bandung: "Jawa Barat",
    Semarang: "Jawa Tengah",
    Yogyakarta: "DI Yogyakarta",
    Malang: "Jawa Timur",
    Medan: "Sumatera Utara",
    Makassar: "Sulawesi Selatan",
    Denpasar: "Bali",
};
export const regionOfCity = (city: string) => CITY_PROVINCE[city] ?? NATIONAL_REGION;

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

export const UNITS = Object.values(Unit);

export enum Status {
    Safe = "safe",
    Warning = "warning",
    Loss = "loss",
}

export enum AlertKind {
    MarginDrop = "margin_drop",
    PriceSurge = "price_surge",
}

export enum PriceSource {
    Nota = "nota",
    Community = "community",
    Pihps = "pihps",
    Sp2kp = "sp2kp",
    Reference = "reference",
    Manual = "manual",
}

export enum Food {
    Chili = "chili",
    Pepper = "pepper",
    Onion = "onion",
    Garlic = "garlic",
    Chicken = "chicken",
    Egg = "egg",
    Beef = "beef",
    Rice = "rice",
    Oil = "oil",
    Sugar = "sugar",
    Flour = "flour",
    Fish = "fish",
    Cucumber = "cucumber",
    Nut = "nut",
    Noodles = "noodles",
    Soup = "soup",
    Tofu = "tofu",
    Salt = "salt",
    Sauce = "sauce",
    Tea = "tea",
    Coconut = "coconut",
    Salad = "salad",
    Skewer = "skewer",
    Coffee = "coffee",
    Dish = "dish",
    Ingredient = "ingredient",
}

export const FOODS = Object.values(Food);

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

export const MANUAL_PRICE_HINTS: Record<string, { name: string; icon: Food; pricePerKg: number }> = {
    tempe: { name: "Tempe", icon: Food.Tofu, pricePerKg: 20000 },
    tahu: { name: "Tahu", icon: Food.Tofu, pricePerKg: 15000 },
    kecap: { name: "Kecap manis", icon: Food.Sauce, pricePerKg: 25000 },
    tepung: { name: "Tepung terigu", icon: Food.Flour, pricePerKg: 14000 },
    timun: { name: "Timun", icon: Food.Cucumber, pricePerKg: 12000 },
    garam: { name: "Garam", icon: Food.Salt, pricePerKg: 8000 },
    teh: { name: "Teh", icon: Food.Tea, pricePerKg: 80000 },
    santan: { name: "Santan", icon: Food.Coconut, pricePerKg: 30000 },
    nasi: { name: "Nasi", icon: Food.Rice, pricePerKg: 5000 },
};
