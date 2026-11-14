import { readFileSync, existsSync } from "fs";
import { cleanEnv, str, port, bool, num, url, makeValidator } from "envalid";
import { CLIENT_TIMEZONES, ClientTimezone } from "#src/utils/date.util.js";

process.env.TZ = "UTC";

const SECRET_PATH_PREFIX = "/run/secrets/";
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;
const MIN_SECRET_LENGTH = 32;
const MIN_UNIQUE_CHARS = 10;

function resolveIfSecretPath(value: string): string {
    if (value.startsWith(SECRET_PATH_PREFIX) && existsSync(value)) {
        try {
            return readFileSync(value, "utf-8").trim();
        } catch (err) {
            console.error(`[env] Failed to read secret file: ${value}`, err);
            return value;
        }
    }
    return value;
}

function resolveAllSecrets(): void {
    for (const [key, value] of Object.entries(process.env)) {
        if (typeof value === "string" && value.startsWith(SECRET_PATH_PREFIX)) {
            process.env[key] = resolveIfSecretPath(value);
        }
    }
}

resolveAllSecrets();

function assertStrongSecret(input: string, varName: string): void {
    if (!input || input.trim().length === 0) {
        throw new Error(`[${varName}] Secret must not be empty.`);
    }

    if (input.length < MIN_SECRET_LENGTH) {
        throw new Error(
            `[${varName}] Secret too short (${input.length} chars, minimum ${MIN_SECRET_LENGTH}). ` +
            `Generate a new one with: openssl rand -hex 32`
        );
    }

    if (BCRYPT_HASH_PATTERN.test(input)) {
        throw new Error(
            `[${varName}] Value looks like a bcrypt hash, not a random secret. ` +
            `Generate a new one with: openssl rand -hex 32`
        );
    }

    const uniqueChars = new Set(input).size;
    if (uniqueChars < MIN_UNIQUE_CHARS) {
        throw new Error(
            `[${varName}] Too few unique characters (${uniqueChars}, minimum ${MIN_UNIQUE_CHARS}). ` +
            `Probably not a secure random string.`
        );
    }
}

const strongSecret = makeValidator<string>((input: string) => {
    const trimmed = input.trim();
    assertStrongSecret(trimmed, "secret");
    return trimmed;
});

const application = {
    NODE_ENV: str({ choices: ["development", "test", "production"], default: "development" }),
    APP_PORT: port({ default: 3000 }),
    APP_CLIENT_TIMEZONE: str({ choices: CLIENT_TIMEZONES, default: ClientTimezone.Utc }),
};

const logs = {
    PRETTY_LOGGING: bool({ default: false }),
    LOG_LEVEL: str({
        choices: ["trace", "debug", "info", "warn", "error", "fatal", "silent"],
        default: "info",
    }),
};

const postgres = {
    DATABASE_NAME: str(),
    DATABASE_USER_NAME: str(),
    DATABASE_PASSWORD: str(),
    DATABASE_HOST: str(),
    DATABASE_PORT: port({ default: 5432 }),
    DATABASE_SSL: bool({ default: true }),
};

const jwt = {
    JWT_ACCESS_TOKEN_KEY: strongSecret(),
    JWT_REFRESH_TOKEN_KEY: strongSecret(),
    JWT_ACCESS_EXPIRES_IN: num({ default: 900 }),
    JWT_REFRESH_EXPIRES_IN: num({ default: 604800 }),
};

const aiEngine = {
    AI_ENGINE_BASEURL: url(),
    AI_ENGINE_APIKEY: str(),
    AI_ENGINE_MODEL: str({ default: "deepseek-v4-flash" }),
    AI_ENGINE_FALLBACK_MODELS: str({ default: "glm-5.3,kimi-k2.6,deepseek-v4.1-flash,gpt-5.6-luna" }),
    AI_ENGINE_VISION_MODELS: str({ default: "" }),
};

export const env = cleanEnv(process.env, {
    ...application,
    ...logs,
    ...postgres,
    ...jwt,
    ...aiEngine,
});

export default env;
