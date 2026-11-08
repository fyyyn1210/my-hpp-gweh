import { inArray } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { commodities } from "#src/drizzle/schemas/index.js";
import { fault } from "#src/utils/response.util.js";

export const assertCommodities = async (ids: Array<string | null>) => {
    const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (wanted.length === 0) return;
    const found = await db.select({ id: commodities.id }).from(commodities).where(inArray(commodities.id, wanted));
    const missing = wanted.filter((id) => !found.some((row) => row.id === id));
    if (missing.length) throw fault({ code: 422, message: "UNKNOWN_COMMODITY", cause: `Unknown commodity: ${missing.join(", ")}` });
};
