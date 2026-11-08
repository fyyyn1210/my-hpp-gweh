import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { commodities } from "./commodities.schema";
import { users } from "./users.schema";

export const notas = pgTable("notas", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    commodityId: text("commodity_id").notNull().references(() => commodities.id, { onDelete: "cascade" }),
    pricePerKg: integer("price_per_kg").notNull(),
    shared: boolean("shared").notNull(),
    recordedAt: timestamp("recorded_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("notas_user_idx").on(table.userId), index("notas_commodity_recorded_idx").on(table.commodityId, table.recordedAt)]);
