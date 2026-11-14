import { parsePihps, dropSpikes } from "./server/src/modules/commodities/pihps.parser.ts";
import { PIHPS_COMMODITY, PIHPS_GRID_URL } from "./server/src/utils/pihps.constant.ts";
const params = new URLSearchParams({ price_type_id: "1", comcat_id: Object.values(PIHPS_COMMODITY).map((i) => i.id).join(","), province_id: "16", regency_id: "", market_id: "", tipe_laporan: "1", start_date: "2026-11-03", end_date: "2026-11-10" });
const rows = parsePihps(await (await fetch(`${PIHPS_GRID_URL}?${params}`)).json(), "Jawa Timur");
const { kept, dropped } = dropSpikes(rows, new Map());
console.log(rows.length, kept.length, dropped.length, [...new Set(rows.map((r) => r.commodityId))].join(","));
console.log(rows.filter((r) => r.priceDate.toISOString().startsWith("2026-11-10")).map((r) => `${r.commodityId}=${r.price}`).join(" "));
