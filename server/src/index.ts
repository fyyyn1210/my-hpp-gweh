import { Elysia } from "elysia";
import env from "#src/configs/env.config.js";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { syncPrices } from "#src/modules/commodities/price.sync.js";
import { PIHPS_SYNC_CRON } from "#src/utils/pihps.constant.js";
import response, { FaultError } from "#src/utils/response.util.js";
import { logger } from "#src/configs/pino.config.js";
import type { Context } from "elysia";
import { alertController } from "#src/modules/alerts/alert.controller.js";
import { assistantController } from "#src/modules/assistant/assistant.controller.js";
import { authController } from "#src/modules/auth/auth.controller.js";
import { commodityController } from "#src/modules/commodities/commodity.controller.js";
import { menuController } from "#src/modules/menus/menu.controller.js";
import { notaController } from "#src/modules/notas/nota.controller.js";
import { profileController } from "#src/modules/profile/profile.controller.js";
import { recipeController } from "#src/modules/recipes/recipe.controller.js";
import { pushController } from "#src/modules/push/push.controller.js";
import { pushDailyReminder, pushPriceNews } from "#src/modules/push/push.service.js";
import { PUSH_PRICE_CRON, PUSH_REMINDER_CRON } from "#src/utils/push.constant.js";

const siteAllowed = env.APP_CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

export const app = new Elysia()
    .use(cors({ origin: siteAllowed }))
    .use(openapi({
        path: "/api/docs",
        enabled: env.NODE_ENV !== "production",
        scalar: {
            url: "/api/docs/json",
        },
        documentation: {
            info: {
                title: "MyHPPGweh API",
                version: "1.0.0",
                description: "API documentation for MyHPPGweh",
            },
            tags: [
                { name: "Auth", description: "Authentication endpoints" },
                { name: "Profile", description: "Signed-in user profile and settings" },
                { name: "Commodities", description: "Commodity catalog, PIHPS price series and community votes" },
                { name: "Menus", description: "Menus and recipes" },
                { name: "Notas", description: "Purchase receipts" },
                { name: "Alerts", description: "Margin and price alerts" },
                { name: "Recipes", description: "Recipe text parser" },
                { name: "Assistant", description: "AI assistant with tool calling" },
                { name: "Push", description: "Firebase push notification devices" },
            ],
            servers: [
                { url: `http://localhost:${env.APP_PORT}`, description: "Local (localhost)" },
                { url: `http://127.0.0.1:${env.APP_PORT}`, description: "Local (127.0.0.1)" },
            ],
            security: [{ bearerAuth: [] }],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
    }))
    .onError({ as: "global" }, ({ code, error, status }) => {
        if (error instanceof FaultError) return status(error.code, response({
            success: false,
            message: error.message,
            data: error.data,
            cause: error.cause as string | undefined,
        }));

        if (code === "VALIDATION") return status("Unprocessable Content", response({
            success: false,
            message: "ERROR_VALIDATION",
            data: error.all.map(e => {
                const reasons = [...e.errors].flatMap((branch) =>
                    [...(branch as Iterable<{ message: string }>)].map((x) => x.message)
                );
                return {
                    path: e.type,
                    field: e.path.slice(1).replaceAll("/", "."),
                    message: e.message,
                    schema: e.schema,
                    ...(reasons.length > 0 && { reasons }),
                };
            }),
        }));

        if (code === "NOT_FOUND") return status("Not Found", response({
            success: false,
            message: code,
            data: null,
        }));

        logger.error({ err: error }, "Unhandled error");
        return status("Internal Server Error", response({
            success: false,
            data: null,
            message: "INTERNAL_ERROR",
            cause: "An error has occurred, please contact the developer",
        }));
    })
    .get("/healthcheck", ({ status }: Context) => {
        return status("OK", response({
            success: true,
            message: "HEALTHCHECK",
            cause: "The server is healthy!",
            data: null,
        }));
    })
    .group("/api/v1", (app) => app
        .use(authController)
        .use(profileController)
        .use(commodityController)
        .use(menuController)
        .use(notaController)
        .use(alertController)
        .use(recipeController)
        .use(assistantController)
        .use(pushController));

if (import.meta.main) {
    app.use(cron({
        name: "price-sync",
        pattern: PIHPS_SYNC_CRON,
        timezone: "UTC",
        protect: true,
        run: () => syncPrices().catch((error) => logger.error({ error: String(error) }, "Price sync cron failed")),
    })).use(cron({
        name: "push-price-news",
        pattern: PUSH_PRICE_CRON,
        timezone: "UTC",
        protect: true,
        run: () => pushPriceNews().catch((error) => logger.error({ error: String(error) }, "Price push cron failed")),
    })).use(cron({
        name: "push-daily-reminder",
        pattern: PUSH_REMINDER_CRON,
        timezone: "UTC",
        protect: true,
        run: () => pushDailyReminder().catch((error) => logger.error({ error: String(error) }, "Reminder push cron failed")),
    })).onStart(({ server }) => {
        console.log(`Server run on port:${server?.port}`);
    }).listen(env.APP_PORT);
}

export type App = typeof app;
