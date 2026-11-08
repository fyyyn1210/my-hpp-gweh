import { boolean, doublePrecision, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { commodities } from "./commodities.schema";
import { users } from "./users.schema";

export const menus = pgTable("menus", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    sellPrice: integer("sell_price").notNull(),
    priceSetAt: timestamp("price_set_at", { precision: 3, withTimezone: true }).notNull(),
    targetMargin: doublePrecision("target_margin").notNull(),
    threshold: doublePrecision("threshold").notNull(),
    extraCost: integer("extra_cost").notNull(),
    custom: boolean("custom").notNull().default(true),
    createdAt: timestamp("created_at", { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("menus_user_idx").on(table.userId)]);

export const menuIngredients = pgTable("menu_ingredients", {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    qty: doublePrecision("qty").notNull(),
    unit: text("unit").notNull(),
    commodityId: text("commodity_id").references(() => commodities.id, { onDelete: "set null" }),
    manualPricePerKg: integer("manual_price_per_kg"),
}, (table) => [index("menu_ingredients_menu_idx").on(table.menuId)]);
