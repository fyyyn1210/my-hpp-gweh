import { Elysia } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { updateProfileSchema } from "#src/modules/profile/profile.schema.js";
import { findUser, toProfile, updateProfile } from "#src/modules/profile/profile.service.js";
import { resetSampleData } from "#src/modules/profile/sample.service.js";
import { DEMO_EMAIL } from "#src/utils/hpp.constant.js";
import response, { fault } from "#src/utils/response.util.js";

export const profileController = new Elysia({ prefix: "/me", detail: { tags: ["Profile"] } })
    .use(authMiddleware)
    .get("/", async ({ userId }) => response({ data: toProfile(await findUser(userId)) }))
    .patch("/", async ({ userId, body }) => response({ message: "PROFILE_UPDATED", data: await updateProfile(userId, body) }), updateProfileSchema)
    .post("/reset", async ({ userId }) => {
        if ((await findUser(userId)).email !== DEMO_EMAIL) {
            throw fault({ code: 403, message: "DEMO_ONLY", cause: "Sample data can only be restored on the demo account" });
        }
        await resetSampleData(userId);
        return response({ message: "SAMPLE_RESTORED", data: null });
    });
