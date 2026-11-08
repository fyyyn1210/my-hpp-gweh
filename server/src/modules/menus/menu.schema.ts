import { t } from "elysia";
import { FOODS, UNITS } from "#src/utils/hpp.constant.js";

export const foodSchema = t.UnionEnum(FOODS as [string, ...string[]]);

export const ingredientSchema = t.Object({
    name: t.String({ minLength: 1, maxLength: 80 }),
    icon: foodSchema,
    qty: t.Number({ exclusiveMinimum: 0 }),
    unit: t.UnionEnum(UNITS as [string, ...string[]]),
    commodityId: t.Nullable(t.String()),
    manualPricePerKg: t.Nullable(t.Integer({ minimum: 0 })),
});

const menuFields = {
    name: t.String({ minLength: 1, maxLength: 80 }),
    icon: foodSchema,
    sellPrice: t.Integer({ minimum: 0 }),
    targetMargin: t.Number({ minimum: 0, maximum: 0.95 }),
    threshold: t.Number({ minimum: 0, maximum: 0.95 }),
    extraCost: t.Integer({ minimum: 0 }),
    ingredients: t.Array(ingredientSchema, { maxItems: 40 }),
};

export const createMenuSchema = { body: t.Object(menuFields) };

export const updateMenuSchema = {
    params: t.Object({ id: t.String({ format: "uuid" }) }),
    body: t.Partial(t.Object({ ...menuFields, resetPriceDate: t.Boolean() })),
};

export const menuIdSchema = { params: t.Object({ id: t.String({ format: "uuid" }) }) };

export type MenuInput = typeof createMenuSchema.body.static;
export type MenuPatch = typeof updateMenuSchema.body.static;
