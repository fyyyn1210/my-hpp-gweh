import { ingestDummyPihps, upsertCatalog } from "#src/modules/commodities/pihps.source.js";

await upsertCatalog();
console.log(`Dummy PIHPS rows: ${await ingestDummyPihps()} (skipped when PIHPS rows already exist; run bun run prices:sync for real prices)`);
process.exit(0);
