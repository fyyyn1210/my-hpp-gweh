import { and, eq, gte, inArray } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { logger } from "#src/configs/pino.config.js";
import { notas, pushLogs, pushTokens, users } from "#src/drizzle/schemas/index.js";
import { buildAlerts } from "#src/modules/alerts/alert.builder.js";
import { loadBook, toBookMenu } from "#src/modules/hpp/hpp.book.js";
import { commodityChange, type BookMenu, type PriceBook } from "#src/modules/hpp/hpp.engine.js";
import { listMenus } from "#src/modules/menus/menu.service.js";
import { findUser } from "#src/modules/profile/profile.service.js";
import { pushEnabled, sendPush, type PushMessage } from "#src/modules/push/push.provider.js";
import { MS_PER_DAY, startOfDay } from "#src/utils/date.util.js";
import { percent } from "#src/utils/format.util.js";
import { AlertKind, TODAY } from "#src/utils/hpp.constant.js";
import { PUSH_ALERTS_MAX, PUSH_DIGEST_ITEMS, PUSH_REMINDER, PUSH_REPEAT_DAYS, PUSH_ROUTES, PUSH_TEST, PushKind } from "#src/utils/push.constant.js";
import { fault } from "#src/utils/response.util.js";

const message = (kind: PushKind, title: string, body: string): PushMessage => ({ kind, title, body, url: PUSH_ROUTES[kind] });

const dayKey = (kind: PushKind) => `${kind}-${startOfDay().toISOString().slice(0, 10)}`;

export const registerToken = async (userId: string, token: string) => {
    if (!pushEnabled) throw fault({ code: 503, message: "PUSH_UNAVAILABLE", cause: "Firebase is not configured on the server" });
    await db.insert(pushTokens).values({ token, userId }).onConflictDoUpdate({ target: pushTokens.token, set: { userId, updatedAt: new Date() } });
};

export const removeToken = (userId: string, token: string) =>
    db.delete(pushTokens).where(and(eq(pushTokens.token, token), eq(pushTokens.userId, userId)));

const alreadySent = async (userId: string, pushKey: string) =>
    (await db.$count(pushLogs, and(
        eq(pushLogs.userId, userId),
        eq(pushLogs.pushKey, pushKey),
        gte(pushLogs.sentAt, new Date(Date.now() - PUSH_REPEAT_DAYS * MS_PER_DAY)),
    ))) > 0;

const notify = async (userId: string, push: PushMessage, pushKey?: string) => {
    if (pushKey && (await alreadySent(userId, pushKey))) return 0;
    const tokens = (await db.select({ token: pushTokens.token }).from(pushTokens).where(eq(pushTokens.userId, userId))).map((row) => row.token);
    if (tokens.length === 0) return 0;
    const { sent, invalid } = await sendPush(tokens, push);
    if (invalid.length) await db.delete(pushTokens).where(inArray(pushTokens.token, invalid));
    if (pushKey && sent > 0) {
        await db.insert(pushLogs).values({ userId, pushKey }).onConflictDoUpdate({ target: [pushLogs.userId, pushLogs.pushKey], set: { sentAt: new Date() } });
    }
    return sent;
};

const recipients = async () =>
    (await db.selectDistinct({ id: users.id }).from(users).innerJoin(pushTokens, eq(pushTokens.userId, users.id)).where(eq(users.notifyPush, true))).map((row) => row.id);

const forEachRecipient = async (run: (userId: string) => Promise<number>) => {
    if (!pushEnabled) return 0;
    let sent = 0;
    for (const userId of await recipients()) {
        try {
            sent += await run(userId);
        } catch (error) {
            logger.error({ userId, error: String(error) }, "Push failed");
        }
    }
    return sent;
};

export const priceDigest = (book: PriceBook, menus: BookMenu[]) => {
    const used = new Set(menus.flatMap((menu) => menu.ingredients.map((item) => item.commodityId)));
    const commodities = Object.values(book.commodities);
    const moves = commodities
        .filter((commodity) => used.has(commodity.id))
        .map((commodity) => ({ name: commodity.name, change: commodityChange(book, commodity, TODAY - 1) }))
        .filter((item) => Math.abs(item.change) >= 0.005)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, PUSH_DIGEST_ITEMS);
    if (used.size === 0) return `Harga ${commodities.length} bahan dari Bank Indonesia dan Kemendag sudah diperbarui.`;
    if (moves.length === 0) return "Harga bahan menu Anda stabil hari ini.";
    return `${moves.map((item) => `${item.name} ${item.change > 0 ? "naik" : "turun"} ${percent(Math.abs(item.change), 0)}`).join(", ")}. Cek modal menu Anda.`;
};

export const pushPriceNews = () =>
    forEachRecipient(async (userId) => {
        const user = await findUser(userId);
        const [book, menus] = await Promise.all([loadBook(user), listMenus(userId)]);
        const bookMenus = menus.map(toBookMenu);
        let sent = await notify(userId, message(PushKind.PriceUpdate, "Harga pasar terbaru sudah masuk", priceDigest(book, bookMenus)), dayKey(PushKind.PriceUpdate));
        for (const alert of buildAlerts(book, bookMenus).slice(0, PUSH_ALERTS_MAX)) {
            const kind = alert.kind === AlertKind.PriceSurge ? PushKind.PriceSurge : PushKind.MarginDrop;
            sent += await notify(userId, message(kind, alert.title, alert.detail), `${alert.id}-${alert.severity}`);
        }
        return sent;
    });

export const pushDailyReminder = async () => {
    const shopped = new Set((await db.selectDistinct({ userId: notas.userId }).from(notas).where(gte(notas.recordedAt, startOfDay()))).map((row) => row.userId));
    return forEachRecipient(async (userId) =>
        shopped.has(userId) ? 0 : notify(userId, message(PushKind.DailyReminder, PUSH_REMINDER.title, PUSH_REMINDER.body), dayKey(PushKind.DailyReminder)),
    );
};

export const pushBroadcast = (title: string, body: string) =>
    forEachRecipient((userId) => notify(userId, message(PushKind.PriceUpdate, title, body)));

export const pushTest = async (userId: string) => {
    if (!pushEnabled) throw fault({ code: 503, message: "PUSH_UNAVAILABLE", cause: "Firebase is not configured on the server" });
    const sent = await notify(userId, message(PushKind.Test, PUSH_TEST.title, PUSH_TEST.body));
    if (sent === 0) throw fault({ code: 404, message: "PUSH_NO_DEVICE", cause: "No registered device for this user" });
    return sent;
};
