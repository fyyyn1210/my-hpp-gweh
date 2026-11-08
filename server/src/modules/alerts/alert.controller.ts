import { Elysia } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { readAlertsSchema } from "#src/modules/alerts/alert.schema.js";
import { listAlerts, markAlertsRead } from "#src/modules/alerts/alert.service.js";
import response from "#src/utils/response.util.js";

export const alertController = new Elysia({ prefix: "/alerts", detail: { tags: ["Alerts"] } })
    .use(authMiddleware)
    .get("/", async ({ userId }) => response({ data: await listAlerts(userId) }))
    .post("/read", async ({ userId, body }) => {
        await markAlertsRead(userId, body.ids);
        return response({ message: "ALERTS_READ", data: null });
    }, readAlertsSchema);
