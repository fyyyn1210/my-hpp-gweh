import { t } from "elysia";

export const createNotaSchema = {
    body: t.Object({
        commodityId: t.String({ minLength: 1 }),
        pricePerKg: t.Integer({ minimum: 1, maximum: 10_000_000 }),
        shared: t.Boolean(),
    }),
};

export const notaIdSchema = { params: t.Object({ id: t.String({ format: "uuid" }) }) };

export type NotaInput = typeof createNotaSchema.body.static;
