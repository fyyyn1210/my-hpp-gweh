import pino from "pino";
import path from "node:path";
import env from "#src/configs/env.config.js";

const usePretty = env.PRETTY_LOGGING;
const isProduction = env.NODE_ENV === "production";
const transport = usePretty
    ? {
        target: "pino-pretty",
        options: { translateTime: "SYS:HH:MM:ss" },
    }
    : {
        target: "pino-roll",
        options: {
            file: path.join("logs", "app"),
            frequency: "daily",
            mkdir: true,
            dateFormat: "yyyy-MM-dd",
            extension: ".log",
            limit: { count: 14 },
        },
    };

export const logger = pino({
    level: env.LOG_LEVEL ?? "info",
    ...(isProduction && {
        redact: {
            paths: [
                "password",
                "card",
                "token",
                "*.password",
                "*.card",
                "*.token",
                "req.headers.authorization",
            ],
            censor: "[Redacted]",
        },
    }),
    transport,
});
