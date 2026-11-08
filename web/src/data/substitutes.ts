import type { Substitute } from "@/lib/types";

export const SUBSTITUTES: Record<string, Substitute[]> = {
  "cabai-rawit": [
    {
      altCommodityId: "cabai-merah",
      name: "Cabai merah keriting",
      ratio: 1.2,
      note: "Rasa lebih manis dan kurang pedas. Tambah jumlahnya agar pedasnya mirip.",
    },
    {
      altCommodityId: null,
      name: "Bubuk cabai",
      ratio: 0.2,
      note: "Harga belum tersedia, tidak bisa dihitung.",
    },
    {
      altCommodityId: null,
      name: "Cabai hijau (harga Anda)",
      ratio: 1.3,
      manualPricePerKg: 32000,
      note: "Pedas segar, warna sambal berubah.",
    },
  ],
  "cabai-merah": [
    {
      altCommodityId: "cabai-rawit",
      name: "Cabai rawit merah",
      ratio: 0.5,
      note: "Lebih pedas, cukup setengah jumlahnya.",
    },
    {
      altCommodityId: null,
      name: "Cabai hijau (harga Anda)",
      ratio: 1,
      manualPricePerKg: 32000,
      note: "Warna berubah, rasa lebih segar.",
    },
  ],
  "bawang-merah": [
    {
      altCommodityId: "bawang-putih",
      name: "Bawang putih",
      ratio: 0.6,
      note: "Aroma lebih tajam, kurangi sedikit takarannya.",
    },
  ],
  ayam: [
    {
      altCommodityId: "telur",
      name: "Telur ayam ras",
      ratio: 0.8,
      note: "Ganti sebagian lauk. Pelanggan mungkin merasa porsi berubah.",
    },
  ],
  telur: [
    {
      altCommodityId: null,
      name: "Tahu (harga Anda)",
      ratio: 1.2,
      manualPricePerKg: 15000,
      note: "Rasa dan tekstur berbeda dari telur.",
    },
  ],
};
