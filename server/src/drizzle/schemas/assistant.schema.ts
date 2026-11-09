import { date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const assistantMessages = pgTable("assistant_messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id"),
    role: text("role").notNull(),
    content: text("content").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("assistant_messages_user_created_idx").on(table.userId, table.createdAt),
    index("assistant_messages_user_session_idx").on(table.userId, table.sessionId),
]);

export const assistantUsage = pgTable("assistant_usage", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    usageDate: date("usage_date", { mode: "string" }).notNull(),
    messages: integer("messages").notNull().default(0),
    tokens: integer("tokens").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.userId, table.usageDate] })]);
