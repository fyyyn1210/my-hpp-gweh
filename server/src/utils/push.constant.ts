export enum PushKind {
    PriceUpdate = "price_update",
    PriceSurge = "price_surge",
    MarginDrop = "margin_drop",
    DailyReminder = "daily_reminder",
    Test = "test",
}

export const PUSH_PRICE_CRON = "30 7 * * 1-5";
export const PUSH_REMINDER_CRON = "0 3 * * *";
export const PUSH_REPEAT_DAYS = 7;
export const PUSH_DIGEST_ITEMS = 3;
export const PUSH_MULTICAST_MAX = 500;
export const PUSH_TTL_SECONDS = 24 * 60 * 60;
export const PUSH_ALERTS_MAX = 2;
export const PUSH_INVALID_TOKEN_CODES = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"];
export const PUSH_REMINDER = { title: "Sudah belanja hari ini?", body: "Catat nota belanja hari ini supaya modal dan untung menu Anda tetap tepat." };
export const PUSH_TEST = { title: "Notifikasi aktif", body: "MyHPPGweh akan mengabari Anda soal harga bahan dan untung menu." };

export const PUSH_ROUTES: Record<PushKind, string> = {
    [PushKind.PriceUpdate]: "/#/harga",
    [PushKind.PriceSurge]: "/#/alarm",
    [PushKind.MarginDrop]: "/#/alarm",
    [PushKind.DailyReminder]: "/#/nota",
    [PushKind.Test]: "/#/pengaturan",
};
