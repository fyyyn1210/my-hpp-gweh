import { Elysia } from "elysia";
import jwt from "@elysiajs/jwt";
import env from "#src/configs/env.config.js";
import { demoUser, login, register } from "#src/modules/auth/auth.service.js";
import { loginSchema, refreshSchema, registerSchema } from "#src/modules/auth/auth.schema.js";
import { findUser, toProfile } from "#src/modules/profile/profile.service.js";
import type { User } from "#src/drizzle/schemas/index.js";
import response, { fault } from "#src/utils/response.util.js";

export const authController = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
    .use(jwt({ name: "accessJwt", secret: env.JWT_ACCESS_TOKEN_KEY, exp: `${env.JWT_ACCESS_EXPIRES_IN}s` }))
    .use(jwt({ name: "refreshJwt", secret: env.JWT_REFRESH_TOKEN_KEY, exp: `${env.JWT_REFRESH_EXPIRES_IN}s` }))
    .resolve(({ accessJwt, refreshJwt }) => ({
        session: async (user: User) => ({
            user: toProfile(user),
            accessToken: await accessJwt.sign({ sub: user.id }),
            refreshToken: await refreshJwt.sign({ sub: user.id }),
        }),
    }))
    .post("/register", async ({ body, session, status }) =>
        status("Created", response({ message: "REGISTERED", data: await session(await register(body)) })), registerSchema)
    .post("/login", async ({ body, session }) =>
        response({ message: "LOGGED_IN", data: await session(await login(body.email, body.password)) }), loginSchema)
    .post("/demo", async ({ session }) => response({ message: "LOGGED_IN", data: await session(await demoUser()) }))
    .post("/refresh", async ({ body, refreshJwt, session }) => {
        const payload = await refreshJwt.verify(body.refreshToken);
        if (!payload || typeof payload.sub !== "string") {
            throw fault({ code: 401, message: "UNAUTHORIZED", cause: "Invalid or expired refresh token" });
        }
        return response({ message: "REFRESHED", data: await session(await findUser(payload.sub)) });
    }, refreshSchema);
