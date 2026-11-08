import { t } from "elysia";
import { citySchema } from "#src/modules/profile/profile.schema.js";
import { PASSWORD_MIN } from "#src/utils/hpp.constant.js";

const email = t.String({ format: "email", maxLength: 254 });
const password = t.String({ minLength: PASSWORD_MIN, maxLength: 72 });

export const registerSchema = {
    body: t.Object({
        name: t.String({ minLength: 1, maxLength: 60 }),
        email,
        password,
        city: citySchema,
        shareCommunity: t.Boolean(),
    }),
};

export const loginSchema = { body: t.Object({ email, password: t.String({ minLength: 1, maxLength: 72 }) }) };

export const refreshSchema = { body: t.Object({ refreshToken: t.String({ minLength: 1 }) }) };

export type RegisterInput = typeof registerSchema.body.static;
