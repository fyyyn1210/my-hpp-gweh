import { and, asc, desc, eq, inArray } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { menuIngredients, menus } from "#src/drizzle/schemas/index.js";
import type { MenuInput, MenuPatch } from "#src/modules/menus/menu.schema.js";
import { assertCommodities } from "#src/modules/commodities/commodity.guard.js";
import { fault } from "#src/utils/response.util.js";
import type { Unit } from "#src/utils/hpp.constant.js";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type MenuRow = typeof menus.$inferSelect;
export type IngredientRow = typeof menuIngredients.$inferSelect;

const toDto = (menu: MenuRow, ingredients: IngredientRow[]) => ({
    id: menu.id,
    name: menu.name,
    icon: menu.icon,
    sellPrice: menu.sellPrice,
    priceSetAt: menu.priceSetAt,
    targetMargin: menu.targetMargin,
    threshold: menu.threshold,
    extraCost: menu.extraCost,
    custom: menu.custom,
    ingredients: ingredients
        .filter((item) => item.menuId === menu.id)
        .sort((a, b) => a.position - b.position)
        .map(({ menuId, position, ...item }) => ({ ...item, unit: item.unit as Unit })),
});

export type MenuDto = ReturnType<typeof toDto>;

const insertIngredients = (tx: Executor, menuId: string, ingredients: MenuInput["ingredients"]) =>
    ingredients.length ? tx.insert(menuIngredients).values(ingredients.map((item, position) => ({ ...item, menuId, position }))) : null;

export const listMenus = async (userId: string) => {
    const rows = await db.select().from(menus).where(eq(menus.userId, userId)).orderBy(desc(menus.createdAt));
    if (rows.length === 0) return [];
    const ingredients = await db.select().from(menuIngredients).where(inArray(menuIngredients.menuId, rows.map((row) => row.id))).orderBy(asc(menuIngredients.position));
    return rows.map((row) => toDto(row, ingredients));
};

export const getMenu = async (userId: string, id: string) => {
    const [row] = await db.select().from(menus).where(and(eq(menus.id, id), eq(menus.userId, userId)));
    if (!row) throw fault({ code: 404, message: "MENU_NOT_FOUND", cause: "Menu not found" });
    const ingredients = await db.select().from(menuIngredients).where(eq(menuIngredients.menuId, id));
    return toDto(row, ingredients);
};

export const insertMenu = async (tx: Executor, userId: string, input: MenuInput, extra: Partial<Pick<MenuRow, "priceSetAt" | "custom" | "createdAt">> = {}) => {
    const { ingredients, ...fields } = input;
    const now = new Date();
    const [row] = await tx.insert(menus).values({ ...fields, userId, priceSetAt: now, createdAt: now, ...extra }).returning();
    await insertIngredients(tx, row.id, ingredients);
    return row.id;
};

export const createMenu = async (userId: string, input: MenuInput) => {
    await assertCommodities(input.ingredients.map((item) => item.commodityId));
    const id = await db.transaction((tx) => insertMenu(tx, userId, input));
    return getMenu(userId, id);
};

export const updateMenu = async (userId: string, id: string, patch: MenuPatch) => {
    await getMenu(userId, id);
    const { ingredients, resetPriceDate, ...fields } = patch;
    if (ingredients) await assertCommodities(ingredients.map((item) => item.commodityId));
    await db.transaction(async (tx) => {
        const values = { ...fields, ...(resetPriceDate ? { priceSetAt: new Date() } : {}) };
        if (Object.keys(values).length) await tx.update(menus).set(values).where(eq(menus.id, id));
        if (ingredients) {
            await tx.delete(menuIngredients).where(eq(menuIngredients.menuId, id));
            await insertIngredients(tx, id, ingredients);
        }
    });
    return getMenu(userId, id);
};

export const deleteMenu = async (userId: string, id: string) => {
    const rows = await db.delete(menus).where(and(eq(menus.id, id), eq(menus.userId, userId))).returning({ id: menus.id });
    if (rows.length === 0) throw fault({ code: 404, message: "MENU_NOT_FOUND", cause: "Menu not found" });
};
