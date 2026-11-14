import { Elysia, t } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { pushTest, registerToken, removeToken } from "#src/modules/push/push.service.js";
import response from "#src/utils/response.util.js";

const tokenSchema = { body: t.Object({ token: t.String({ minLength: 10, maxLength: 4096 }) }) };

export const pushController = new Elysia({ prefix: "/push", detail: { tags: ["Push"] } })
    .use(authMiddleware)
    .post("/tokens", async ({ userId, body }) => {
        await registerToken(userId, body.token);
        return response({ message: "PUSH_TOKEN_SAVED", data: null });
    }, tokenSchema)
    .delete("/tokens", async ({ userId, body }) => {
        await removeToken(userId, body.token);
        return response({ message: "PUSH_TOKEN_REMOVED", data: null });
    }, tokenSchema)
    .post("/test", async ({ userId }) => response({ message: "PUSH_SENT", data: { sent: await pushTest(userId) } }));
