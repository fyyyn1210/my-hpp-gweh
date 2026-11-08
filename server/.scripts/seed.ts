import { demoUser } from "#src/modules/auth/auth.service.js";
import { ingestDummyPihps, upsertCatalog } from "#src/modules/commodities/pihps.source.js";

await upsertCatalog();
console.log(`PIHPS rows: ${await ingestDummyPihps()}`);
console.log(`Demo user: ${(await demoUser()).email}`);
process.exit(0);
