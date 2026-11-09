import { Unit } from "#src/utils/hpp.constant.js";

export enum AssistantRole {
    User = "user",
    Assistant = "assistant",
    Reset = "reset",
}

export enum CardKind {
    Quote = "quote",
    Status = "status",
    Actions = "actions",
    Price = "price",
    NotaDraft = "nota_draft",
    PriceDraft = "price_draft",
    MenuDraft = "menu_draft",
    MenuDelete = "menu_delete",
    Ranking = "ranking",
}

export enum ToolName {
    MenuStatus = "menu_status",
    PriceOptions = "price_options",
    IngredientPrice = "ingredient_price",
    RiskyMenus = "risky_menus",
    CateringQuote = "catering_quote",
    DraftNota = "draft_nota",
    DraftSellPrice = "draft_sell_price",
    DraftNewMenu = "draft_new_menu",
    DraftMenuChange = "draft_menu_change",
    DraftMenuDelete = "draft_menu_delete",
}

export enum StreamEvent {
    Status = "status",
    Reply = "reply",
    Error = "error",
}

export const STEP_READING = "Membaca pertanyaan...";
export const STEP_WRITING = "Menyusun jawaban...";
export const STEP_TOOL_FALLBACK = "Menghitung...";

export const TOOL_STEPS: Record<ToolName, string> = {
    [ToolName.MenuStatus]: "Mengecek untung menu...",
    [ToolName.PriceOptions]: "Mencari pilihan untuk menu...",
    [ToolName.IngredientPrice]: "Mengecek harga bahan...",
    [ToolName.RiskyMenus]: "Mengurutkan menu paling rawan...",
    [ToolName.CateringQuote]: "Menghitung pesanan...",
    [ToolName.DraftNota]: "Menyiapkan catatan belanja...",
    [ToolName.DraftSellPrice]: "Menyiapkan harga jual baru...",
    [ToolName.DraftNewMenu]: "Menyiapkan menu baru...",
    [ToolName.DraftMenuChange]: "Menyiapkan perubahan menu...",
    [ToolName.DraftMenuDelete]: "Menyiapkan hapus menu...",
};

export const TOOL_CARDS: Partial<Record<ToolName, CardKind>> = {
    [ToolName.MenuStatus]: CardKind.Status,
    [ToolName.PriceOptions]: CardKind.Actions,
    [ToolName.IngredientPrice]: CardKind.Price,
    [ToolName.RiskyMenus]: CardKind.Ranking,
    [ToolName.CateringQuote]: CardKind.Quote,
    [ToolName.DraftNota]: CardKind.NotaDraft,
    [ToolName.DraftSellPrice]: CardKind.PriceDraft,
    [ToolName.DraftNewMenu]: CardKind.MenuDraft,
    [ToolName.DraftMenuChange]: CardKind.MenuDraft,
    [ToolName.DraftMenuDelete]: CardKind.MenuDelete,
};

export const MESSAGE_MAX = 400;
export const DAILY_LIMIT = 50;
export const DEMO_DAILY_LIMIT = 200;
export const HISTORY_LIMIT = 20;
export const HISTORY_CHARS = 6000;
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
export const SESSION_LIST_LIMIT = 50;
export const MAX_TOOL_CALLS = 4;
export const CACHE_MAX = 500;
export const CACHE_TTL_MS = 10 * 60 * 1000;
export const LLM_TIMEOUT_MS = 8_000;
export const LLM_BUDGET_MS = 25_000;
export const MODEL_COOLDOWN_MS = 60_000;
export const QUOTA_COOLDOWN_MS = 15 * 60_000;
export const BAD_REQUEST_COOLDOWN_MS = 10 * 60_000;
export const QUOTA_STATUSES = [402, 403, 429];
export const LLM_TEMPERATURE = 0.2;
export const FREE_NUMBER_MAX = 10;
export const MONEY_TOLERANCE = 0.05;
export const PERCENT_TOLERANCE = 1;
export const QUANTITY_WORDS = new Set(["gram", "gr", "g", "kg", "kilo", "ons", "ml", "liter", "sdm", "sdt", "butir", "siung", "buah", "lembar", "batang", "ruas", "potong", "bungkus", "gelas", "porsi"]);

export const NEW_MENU_DEFAULTS = { targetMargin: 0.25, threshold: 0.2, extraCost: 1000 };
export const MENU_NAME_MAX = 80;
export const BATCH_SMALL_UNITS: Partial<Record<Unit, { unit: Unit; factor: number }>> = {
    [Unit.Kg]: { unit: Unit.Gram, factor: 1000 },
    [Unit.Ons]: { unit: Unit.Gram, factor: 100 },
    [Unit.Liter]: { unit: Unit.Ml, factor: 1000 },
};
export const BUY_UNITS: Record<string, number> = { kg: 1, ons: 0.1, gram: 0.001, liter: 1 };
export const PORTION_CHOICES = [50, 100, 200, 500];
export const WHEN_CHOICES = [
    { label: "1 minggu lagi", days: 7 },
    { label: "2 minggu lagi", days: 14 },
    { label: "3 minggu lagi", days: 21 },
    { label: "1 bulan lagi", days: 30 },
];
export const COMMON_MENU_WORDS = new Set(["nasi", "ayam", "mie", "telur", "daging", "goreng"]);

export const DEFAULT_REPLY = "Maaf, saya belum paham. Saya bisa bantu soal untung menu, harga bahan, catat belanja, dan hitung pesanan.";
