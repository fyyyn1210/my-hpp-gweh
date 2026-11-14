import { communityStats, hpp, latestNota, marginOf, priceInfo, statusOf, type PriceBook } from "#src/modules/hpp/hpp.engine.js";
import { PriceSource, Status, TODAY, Unit } from "#src/utils/hpp.constant.js";

const assert = (ok: boolean, label: string) => {
    if (!ok) throw new Error(label);
};

const chili = { id: "chili", name: "Cabai", source: PriceSource.Pihps, prices: Array(TODAY + 1).fill(40000), unitOverrides: { [Unit.Butir]: 3 } };
const book: PriceBook = { commodities: { chili }, notas: [], votes: [], shareCommunity: true };
const menu = { id: "m", name: "M", sellPrice: 10000, priceSetDay: TODAY - 10, threshold: 0.2, extraCost: 1000, ingredients: [
    { qty: 100, unit: Unit.Gram, commodityId: "chili", manualPricePerKg: null },
    { qty: 10, unit: Unit.Butir, commodityId: "chili", manualPricePerKg: null },
    { qty: 200, unit: Unit.Gram, commodityId: null, manualPricePerKg: 10000 },
] };

assert(priceInfo(book, chili).source === PriceSource.Pihps, "market source fallback");
assert(priceInfo(book, { ...chili, source: PriceSource.Sp2kp }).source === PriceSource.Sp2kp, "market source follows commodity");
assert(Math.abs(hpp(book, menu) - (4000 + 1200 + 2000 + 1000)) < 1e-6, "hpp sums grams, overrides, manual and extra cost");
assert(marginOf(10000, 8200) - 0.18 < 1e-9 && statusOf(book, menu) === Status.Warning, "warning under threshold");

book.notas = [{ commodityId: "chili", pricePerKg: 44000, day: TODAY - 3, shared: true }];
assert(priceInfo(book, chili).price === 44000, "nota wins");
assert(latestNota(book, "chili", TODAY + 12) === null || TODAY - 3 + 14 >= TODAY + 12, "nota window");
assert(Math.abs(priceInfo(book, chili, TODAY - 20).price - 44000) < 1e-6, "calibration scales old pihps");

book.notas = [];
book.votes = [38000, 39000, 41000, 400000].map((pricePerKg) => ({ commodityId: "chili", pricePerKg, day: TODAY - 1 }));
const stats = communityStats(book, chili)!;
assert(stats.count === 3 && stats.dropped === 1 && stats.median === 39000, "community median drops outliers");
book.votes = book.votes.map((vote) => ({ ...vote, day: TODAY - 9 }));
assert(communityStats(book, chili) === null, "old votes ignored");

console.log("hpp engine ok");
