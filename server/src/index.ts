import { Elysia } from "elysia";
import env from "#src/configs/env.config.js";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";
import response, { FaultError } from "#src/utils/response.util.js";
import { logger } from "#src/configs/pino.config.js";
import type { Context } from "elysia";

const siteAllowed = env.NODE_ENV !== "production" ? ["*"] : [];

const app = new Elysia()
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
            tags: [{ name: "Auth", description: "Authentication endpoints" }],
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
    .group("/api/v1", (app) => app)
    .onStart(({ server }) => {
        console.log(`Server run on port:${server?.port}`);
    })
    .listen(env.APP_PORT);

export type App = typeof app;
