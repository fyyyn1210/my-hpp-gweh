import { NATIONAL_REGION } from "#src/utils/hpp.constant.js";

export const PIHPS_GRID_URL = "https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetGridDataDaerah";
export const PIHPS_TRADITIONAL_MARKET = 1;
export const PIHPS_TIMEOUT_MS = 120_000;
export const PIHPS_RESYNC_DAYS = 7;
export const PIHPS_MIRROR_URL = "https://harga-pangan.fly.dev/harga/terbaru";
export const SPIKE_LIMIT = 0.5;
export const PIHPS_SYNC_CRON = "0 7,17 * * *";

export const PIHPS_COMMODITY: Record<string, { id: string; name: string }> = {
    "cabai-rawit": { id: "com_16", name: "Cabai Rawit Merah" },
    "cabai-merah": { id: "com_14", name: "Cabai Merah Keriting" },
    "bawang-merah": { id: "com_11", name: "Bawang Merah Ukuran Sedang" },
    "bawang-putih": { id: "com_12", name: "Bawang Putih Ukuran Sedang" },
    ayam: { id: "com_7", name: "Daging Ayam Ras Segar" },
    telur: { id: "com_10", name: "Telur Ayam Ras Segar" },
    sapi: { id: "com_8", name: "Daging Sapi Kualitas 1" },
    beras: { id: "com_3", name: "Beras Kualitas Medium I" },
    minyak: { id: "com_17", name: "Minyak Goreng Curah" },
    gula: { id: "com_21", name: "Gula Pasir Lokal" },
    "cabai-merah-besar": { id: "com_13", name: "Cabai Merah Besar" },
    "cabai-rawit-hijau": { id: "com_15", name: "Cabai Rawit Hijau" },
    "beras-premium": { id: "com_5", name: "Beras Kualitas Super I" },
    "minyak-kemasan": { id: "com_18", name: "Minyak Goreng Kemasan Bermerk 1" },
    "gula-premium": { id: "com_20", name: "Gula Pasir Kualitas Premium" },
};

export const PIHPS_PROVINCE: Record<string, string> = {
    [NATIONAL_REGION]: "",
    "DKI Jakarta": "13",
    "Jawa Barat": "12",
    "Jawa Tengah": "14",
    "DI Yogyakarta": "15",
    "Jawa Timur": "16",
    Bali: "17",
    "Sumatera Utara": "2",
    "Sulawesi Selatan": "26",
};
