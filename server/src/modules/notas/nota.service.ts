import { and, desc, eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { notas } from "#src/drizzle/schemas/index.js";
import { assertCommodities } from "#src/modules/commodities/commodity.guard.js";
import type { NotaInput } from "#src/modules/notas/nota.schema.js";
import { fault } from "#src/utils/response.util.js";

const columns = { id: notas.id, commodityId: notas.commodityId, pricePerKg: notas.pricePerKg, shared: notas.shared, recordedAt: notas.recordedAt };

export const listNotas = (userId: string) => db.select(columns).from(notas).where(eq(notas.userId, userId)).orderBy(desc(notas.recordedAt));

export const createNota = async (userId: string, input: NotaInput) => {
    await assertCommodities([input.commodityId]);
    const [row] = await db.insert(notas).values({ ...input, userId }).returning(columns);
    return row;
};

export const deleteNota = async (userId: string, id: string) => {
    const rows = await db.delete(notas).where(and(eq(notas.id, id), eq(notas.userId, userId))).returning({ id: notas.id });
    if (rows.length === 0) throw fault({ code: 404, message: "NOTA_NOT_FOUND", cause: "Nota not found" });
};
