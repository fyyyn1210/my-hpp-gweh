import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const alertReads = pgTable("alert_reads", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    alertId: text("alert_id").notNull(),
    readAt: timestamp("read_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.alertId] })]);
