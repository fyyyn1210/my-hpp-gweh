import { integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { Unit } from "../../utils/hpp.constant";

export const commodities = pgTable("commodities", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    priceUnit: text("price_unit").notNull(),
    aliases: text("aliases").array().notNull(),
    unitOverrides: jsonb("unit_overrides").$type<Partial<Record<Unit, number>>>().notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
});

export const commodityPrices = pgTable("commodity_prices", {
    id: serial("id").primaryKey(),
    commodityId: text("commodity_id").notNull().references(() => commodities.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    price: integer("price").notNull(),
    priceDate: timestamp("price_date", { precision: 3, withTimezone: true }).notNull(),
}, (table) => [uniqueIndex("commodity_prices_commodity_source_date_idx").on(table.commodityId, table.source, table.priceDate)]);

export type Commodity = typeof commodities.$inferSelect;
