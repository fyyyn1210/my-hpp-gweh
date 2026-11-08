import { Elysia } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { createNotaSchema, notaIdSchema } from "#src/modules/notas/nota.schema.js";
import { createNota, deleteNota, listNotas } from "#src/modules/notas/nota.service.js";
import response from "#src/utils/response.util.js";

export const notaController = new Elysia({ prefix: "/notas", detail: { tags: ["Notas"] } })
    .use(authMiddleware)
    .get("/", async ({ userId }) => response({ data: await listNotas(userId) }))
    .post("/", async ({ userId, body, status }) => status("Created", response({ message: "NOTA_CREATED", data: await createNota(userId, body) })), createNotaSchema)
    .delete("/:id", async ({ userId, params }) => {
        await deleteNota(userId, params.id);
        return response({ message: "NOTA_DELETED", data: null });
    }, notaIdSchema);
