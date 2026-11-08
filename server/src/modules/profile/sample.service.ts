import { eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { alertReads, menus, notas } from "#src/drizzle/schemas/index.js";
import { SAMPLE_MENUS, SAMPLE_NOTAS } from "#src/drizzle/seeds/catalog.js";
import { listCommodities } from "#src/modules/commodities/commodity.service.js";
import { insertMenu } from "#src/modules/menus/menu.service.js";
import { dateOfDay } from "#src/utils/date.util.js";
import { TODAY } from "#src/utils/hpp.constant.js";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const seedSampleData = async (tx: Executor, userId: string) => {
    const prices = Object.fromEntries((await listCommodities()).map((item) => [item.id, item.prices]));
    const now = Date.now();
    for (const [index, { daysAgo, ...menu }] of SAMPLE_MENUS.entries()) {
        await insertMenu(tx, userId, menu, { priceSetAt: dateOfDay(TODAY - daysAgo), custom: false, createdAt: new Date(now - index) });
    }
    const sampleNotas = SAMPLE_NOTAS.filter((nota) => prices[nota.commodityId]).map((nota) => ({
        userId,
        commodityId: nota.commodityId,
        pricePerKg: Math.round((prices[nota.commodityId][TODAY - nota.daysAgo] * nota.ratio) / 500) * 500,
        shared: nota.shared,
        recordedAt: dateOfDay(TODAY - nota.daysAgo),
    }));
    if (sampleNotas.length) await tx.insert(notas).values(sampleNotas);
};

export const resetSampleData = (userId: string) =>
    db.transaction(async (tx) => {
        await tx.delete(menus).where(eq(menus.userId, userId));
        await tx.delete(notas).where(eq(notas.userId, userId));
        await tx.delete(alertReads).where(eq(alertReads.userId, userId));
        await seedSampleData(tx, userId);
    });
