import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    shareCommunity: boolean("share_community").notNull().default(true),
    roundingStep: integer("rounding_step").notNull().default(500),
    notifyInApp: boolean("notify_in_app").notNull().default(true),
    notifyTelegram: boolean("notify_telegram").notNull().default(true),
    createdAt: timestamp("created_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
