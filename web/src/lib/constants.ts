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
export const STORAGE_KEY = "hpp-pintar-state-v4";
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
export const PROFILE_SAVE_DELAY_MS = 600;
export const EXPLAIN_DELAY_MS = 900;
export const PASSWORD_MIN = 6;
export const DEMO_EMAIL = "demo@myhppgweh.id";
export const SUGGEST_IDLE_MS = 3000;
export const SUGGEST_MAX_WORDS = 3;
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

export enum Formula {
  Margin = "margin",
  MarginThen = "margin_then",
  MarginNew = "margin_new",
  AverageMargin = "average_margin",
  Erosion = "erosion",
  Threshold = "threshold",
  Target = "target",
  PortionCut = "portion_cut",
  PriceChange = "price_change",
  NotaDiff = "nota_diff",
  Calibration = "calibration",
  Buffer = "buffer",
}

export const FORMULAS: Record<Formula, { title: string; text: string; formula: string }> = {
  [Formula.Margin]: {
    title: "Untung per porsi",
    text: "Dari tiap Rp100 harga jual, sebanyak ini yang jadi untung Anda.",
    formula: "(harga jual − modal) ÷ harga jual",
  },
  [Formula.MarginThen]: {
    title: "Untung saat harga ditetapkan",
    text: "Untung waktu harga jual ini Anda tetapkan, memakai harga bahan hari itu.",
    formula: "(harga jual − modal hari itu) ÷ harga jual",
  },
  [Formula.MarginNew]: {
    title: "Untung setelah diubah",
    text: "Perkiraan untung kalau pilihan ini dipakai, dengan harga bahan hari ini.",
    formula: "(harga jual baru − modal baru) ÷ harga jual baru",
  },
  [Formula.AverageMargin]: {
    title: "Untung rata-rata",
    text: "Rata-rata untung semua menu Anda hari ini.",
    formula: "jumlah untung % semua menu ÷ jumlah menu",
  },
  [Formula.Erosion]: {
    title: "Untung turun",
    text: "Selisih untung sekarang dengan untung saat harga jual ditetapkan. 1 poin = 1%.",
    formula: "untung % dulu − untung % sekarang",
  },
  [Formula.Threshold]: {
    title: "Batas aman",
    text: "Kalau untung di bawah angka ini, menu diberi tanda Waspada. Anda yang menentukan.",
    formula: "untung % < batas aman → Waspada",
  },
  [Formula.Target]: {
    title: "Target untung",
    text: "Untung yang Anda inginkan. Dipakai untuk menghitung saran harga dan porsi.",
    formula: "harga saran = modal ÷ (1 − target)",
  },
  [Formula.PortionCut]: {
    title: "Kurangi porsi",
    text: "Bahan per porsi yang perlu dikurangi supaya untung kembali ke target tanpa naik harga.",
    formula: "1 − (harga jual × (1 − target) − biaya lain) ÷ biaya bahan",
  },
  [Formula.PriceChange]: {
    title: "Perubahan harga",
    text: "Naik atau turunnya harga bahan dibanding harga sebelumnya.",
    formula: "(harga baru − harga lama) ÷ harga lama",
  },
  [Formula.NotaDiff]: {
    title: "Selisih dengan pasar",
    text: "Seberapa mahal atau murah harga nota Anda dibanding harga pasar.",
    formula: "(harga nota − harga pasar) ÷ harga pasar",
  },
  [Formula.Calibration]: {
    title: "Selisih nota Anda",
    text: "Biasanya harga belanja Anda segini dari harga pasar. Dipakai menebak harga saat belum ada nota baru.",
    formula: "nilai tengah (harga nota ÷ harga pasar) − 1",
  },
  [Formula.Buffer]: {
    title: "Cadangan kenaikan",
    text: "Kenaikan harga bahan yang mungkin terjadi sampai hari acara, dilihat dari riwayat harga.",
    formula: "kenaikan dalam rentang hari yang sama, 9 dari 10 kejadian di bawah angka ini",
  },
};

export const MENU_ICONS = [Food.Dish, Food.Chicken, Food.Rice, Food.Noodles, Food.Salad, Food.Soup, Food.Egg, Food.Fish, Food.Skewer, Food.Coffee];

export const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: "Email ini sudah terdaftar. Silakan masuk.",
  INVALID_CREDENTIALS: "Email atau kata sandi salah.",
  UNAUTHORIZED: "Sesi habis. Silakan masuk lagi.",
  ERROR_VALIDATION: "Isian belum benar. Cek lagi.",
  NETWORK_ERROR: "Server tidak bisa dihubungi. Cek koneksi lalu coba lagi.",
  MENU_NOT_FOUND: "Menu tidak ditemukan.",
  NOTA_NOT_FOUND: "Catatan tidak ditemukan.",
  UNKNOWN_COMMODITY: "Ada bahan yang tidak dikenal.",
};
export const DEFAULT_ERROR = "Gagal menyimpan. Coba lagi.";
