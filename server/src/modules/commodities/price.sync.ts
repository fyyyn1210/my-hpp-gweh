import { syncPihps, upsertCatalog } from "#src/modules/commodities/pihps.source.js";
import { syncSp2kp } from "#src/modules/commodities/sp2kp.source.js";

export const syncPrices = async ({ full = false } = {}) => {
    await upsertCatalog();
    const [pihps, sp2kp] = await Promise.allSettled([syncPihps({ full }), syncSp2kp({ full })]);
    const failed = [pihps, sp2kp].flatMap((result) => (result.status === "rejected" ? [String(result.reason)] : []));
    if (failed.length > 0) throw new Error(failed.join("; "));
    return { pihps: pihps.status === "fulfilled" ? pihps.value : 0, sp2kp: sp2kp.status === "fulfilled" ? sp2kp.value : 0 };
};
