import { syncPrices } from "#src/modules/commodities/price.sync.js";

const { pihps, sp2kp } = await syncPrices({ full: process.argv.includes("--full") });
console.log(`PIHPS rows: ${pihps}, SP2KP rows: ${sp2kp}`);
