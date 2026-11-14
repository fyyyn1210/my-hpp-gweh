import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const pushTokens = pgTable("push_tokens", {
    token: text("token").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pushLogs = pgTable("push_logs", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    pushKey: text("push_key").notNull(),
    sentAt: timestamp("sent_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.pushKey] })]);
