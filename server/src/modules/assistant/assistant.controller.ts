import { Elysia, t } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { currentSession, getSession, listSessions, resetSession, sendMessage } from "#src/modules/assistant/assistant.service.js";
import { logger } from "#src/configs/pino.config.js";
import { MESSAGE_MAX, StreamEvent } from "#src/utils/assistant.constant.js";
import response, { FaultError } from "#src/utils/response.util.js";

const messageSchema = { body: t.Object({ text: t.String({ minLength: 1, maxLength: MESSAGE_MAX }) }) };
const encoder = new TextEncoder();

const streamReply = (userId: string, text: string) =>
    new ReadableStream({
        async start(controller) {
            const send = (event: StreamEvent, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            try {
                send(StreamEvent.Reply, await sendMessage(userId, text, (step) => send(StreamEvent.Status, step)));
            } catch (error) {
                if (!(error instanceof FaultError)) logger.error({ err: error }, "Assistant stream failed");
                send(StreamEvent.Error, { message: error instanceof FaultError ? error.message : "INTERNAL_ERROR" });
            } finally {
                controller.close();
            }
        },
    });

export const assistantController = new Elysia({ prefix: "/assistant", detail: { tags: ["Assistant"] } })
    .use(authMiddleware)
    .get("/messages", async ({ userId }) => response({ data: await currentSession(userId) }))
    .get("/sessions", async ({ userId }) => response({ data: await listSessions(userId) }))
    .get("/sessions/:id", async ({ userId, params }) => response({ data: await getSession(userId, params.id) }), {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
    })
    .post("/messages", async ({ userId, body }) => response({ data: await sendMessage(userId, body.text) }), messageSchema)
    .post("/messages/stream", ({ userId, body, set }) => {
        set.headers["content-type"] = "text/event-stream";
        set.headers["cache-control"] = "no-cache";
        return new Response(streamReply(userId, body.text));
    }, messageSchema)
    .post("/reset", async ({ userId }) => {
        await resetSession(userId);
        return response({ message: "ASSISTANT_RESET", data: null });
    });
