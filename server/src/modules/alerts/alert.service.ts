import { eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { alertReads } from "#src/drizzle/schemas/index.js";
import { buildAlerts } from "#src/modules/alerts/alert.builder.js";
import { loadBook, toBookMenu } from "#src/modules/hpp/hpp.book.js";
import { listMenus } from "#src/modules/menus/menu.service.js";
import { findUser } from "#src/modules/profile/profile.service.js";
import { startOfDay } from "#src/utils/date.util.js";

export const listAlerts = async (userId: string) => {
    const user = await findUser(userId);
    const [book, menus, reads] = await Promise.all([
        loadBook(user),
        listMenus(userId),
        db.select({ alertId: alertReads.alertId }).from(alertReads).where(eq(alertReads.userId, userId)),
    ]);
    const read = new Set(reads.map((row) => row.alertId));
    const createdAt = startOfDay();
    return buildAlerts(book, menus.map(toBookMenu)).map((alert) => ({ ...alert, createdAt, read: read.has(alert.id) }));
};

export const markAlertsRead = async (userId: string, ids: string[]) => {
    if (ids.length) await db.insert(alertReads).values(ids.map((alertId) => ({ userId, alertId }))).onConflictDoNothing();
};
