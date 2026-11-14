import { dropSpikes, parsePihps, parsePihpsMirror } from "#src/modules/commodities/pihps.parser.js";
import { nationalRows, parseSp2kp } from "#src/modules/commodities/sp2kp.source.js";

const assert = (ok: boolean, label: string) => {
    if (!ok) throw new Error(label);
};

const body = {
    data: [
        { no: "I", name: "Daging Ayam", level: 1, "09/11/2026": "38,300" },
        { no: 1, name: "Daging Ayam Ras Segar", level: 2, "09/11/2026": "38,300", "10/11/2026": "-" },
        { no: 1, name: "Cabai Merah Keriting ", level: 2, "10/11/2026": "87,650" },
    ],
};
const rows = parsePihps(body, "Jawa Timur");
assert(rows.length === 2, "skips category rows and empty prices");
assert(rows[0].commodityId === "ayam" && rows[0].price === 38300 && rows[0].priceDate.toISOString() === "2026-11-09T00:00:00.000Z", "parses ayam");
assert(rows[1].commodityId === "cabai-merah", "trims names");

let threw = false;
try {
    parsePihps({ data: [{ name: "Ayam Baru", level: 2 }] }, "national");
} catch {
    threw = true;
}
assert(threw, "unknown commodity fails loudly");

const day = (date: number, price: number) => ({ ...rows[0], price, priceDate: new Date(Date.UTC(2026, 10, date)) });
const spike = dropSpikes([day(2, 39000), day(1, 38000), day(3, 380000), day(4, 38500)], new Map());
assert(spike.dropped.length === 1 && spike.dropped[0].price === 380000, "drops one-day typo");
assert(spike.kept.map((row) => row.price).join() === "38000,39000,38500", "keeps sorted rest");

const real = dropSpikes([day(5, 70000), day(6, 71000)], new Map([["ayam|Jawa Timur", 38000]]));
assert(real.dropped.length === 0, "keeps jump confirmed next day");
const pending = dropSpikes([day(5, 70000)], new Map([["ayam|Jawa Timur", 38000]]));
assert(pending.dropped.length === 1, "unconfirmed last-day jump waits");

const sp2kp = parseSp2kp({ data: [
    { tanggal: "2026-11-13", variant_id: 42, harga: 3400 },
    { tanggal: "2026-11-13", variant_id: 35, harga: 11166.6 },
    { tanggal: "2026-11-13", variant_id: 999, harga: 5000 },
    { tanggal: "2026-11-13", variant_id: 26, harga: 0 },
] }, "Jawa Timur");
assert(sp2kp.length === 2 && sp2kp[0].commodityId === "mie-instan" && sp2kp[0].price === 40000, "sp2kp converts packs to kg");
assert(sp2kp[1].commodityId === "tahu" && sp2kp[1].price === 11167, "sp2kp maps variants, skips unknown and zero");
const national = nationalRows([...sp2kp, { ...sp2kp[0], region: "Bali", price: 44000 }, { ...sp2kp[0], region: "DKI Jakarta", price: 50000 }]);
assert(national.find((row) => row.commodityId === "mie-instan")?.price === 44000, "sp2kp national is province median");
const mirror = parsePihpsMirror({ tanggal: "2026-11-13", data: [{ harga: [
    { wilayah: { level: "provinsi", nama: "Bali" }, harga: 61450 },
    { wilayah: { level: "provinsi", nama: "Banten" }, harga: 72150 },
    { wilayah: { level: "provinsi", nama: "Aceh" }, harga: 70000 },
    { wilayah: { level: "kabupaten_kota", nama: "Kab. Badung" }, harga: 1 },
] }] }, "cabai-rawit", ["national", "Bali"]);
assert(mirror.length === 2 && mirror[0].price === 70000 && mirror[1].region === "Bali", "mirror keeps known provinces plus national median");

console.log("pihps ok");
