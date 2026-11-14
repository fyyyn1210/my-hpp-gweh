import { Elysia } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { updateProfileSchema } from "#src/modules/profile/profile.schema.js";
import { findUser, toProfile, updateProfile } from "#src/modules/profile/profile.service.js";
import response from "#src/utils/response.util.js";

export const profileController = new Elysia({ prefix: "/me", detail: { tags: ["Profile"] } })
    .use(authMiddleware)
    .get("/", async ({ userId }) => response({ data: toProfile(await findUser(userId)) }))
    .patch("/", async ({ userId, body }) => response({ message: "PROFILE_UPDATED", data: await updateProfile(userId, body) }), updateProfileSchema);
