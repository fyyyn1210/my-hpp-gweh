export const SP2KP_PRICE_URL = "https://api-sp2kp.kemendag.go.id/report/api/average-price-public";
export const SP2KP_PROVINCE_LEVEL = 1;
export const SP2KP_PAGE_SIZE = 200;
export const SP2KP_TIMEOUT_MS = 30_000;
export const SP2KP_DELAY_MS = 700;
export const SP2KP_RESYNC_DAYS = 7;

export const SP2KP_PROVINCE: Record<string, string> = {
    "DKI Jakarta": "31",
    "Jawa Barat": "32",
    "Jawa Tengah": "33",
    "DI Yogyakarta": "34",
    "Jawa Timur": "35",
    Bali: "51",
    "Sumatera Utara": "12",
    "Sulawesi Selatan": "73",
};

export const SP2KP_VARIANT: Record<string, number> = {
    "cabai-rawit": 10,
    "cabai-merah": 2,
    "bawang-merah": 13,
    "bawang-putih": 38,
    ayam: 27,
    telur: 25,
    sapi: 19,
    beras: 52,
    minyak: 16,
    gula: 14,
    "cabai-merah-besar": 9,
    "cabai-rawit-hijau": 11,
    "beras-premium": 51,
    "minyak-kemasan": 17,
    "gula-premium": 15,
    minyakita: 18,
    "telur-kampung": 44,
    "sapi-tetelan": 22,
    "sapi-sandung-lamur": 21,
    "tepung-terigu": 26,
    jagung: 34,
    kedelai: 28,
    tahu: 35,
    tempe: 36,
    "mie-instan": 42,
    "ikan-tongkol": 20,
    "ikan-teri": 23,
    "ikan-bandeng": 24,
    "ikan-kembung": 30,
    udang: 40,
    garam: 41,
    "kacang-tanah": 45,
    "kacang-hijau": 46,
    singkong: 47,
    kentang: 57,
    "bawang-bombai": 37,
    tomat: 56,
    timun: 3,
    sawi: 5,
    kangkung: 58,
    "kacang-panjang": 4,
    pisang: 54,
    jeruk: 55,
};

export const SP2KP_PACK_GRAMS: Record<string, number> = { "mie-instan": 85 };
