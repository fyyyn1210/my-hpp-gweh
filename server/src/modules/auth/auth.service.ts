import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { users } from "#src/drizzle/schemas/index.js";
import type { RegisterInput } from "#src/modules/auth/auth.schema.js";
import { fault } from "#src/utils/response.util.js";

const BCRYPT_ROUNDS = 10;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const findByEmail = async (email: string) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ?? null;
};

const createUser = async ({ password, ...input }: RegisterInput) => {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [user] = await db.insert(users).values({ ...input, passwordHash }).returning();
    return user;
};

export const register = async (input: RegisterInput) => {
    const email = normalizeEmail(input.email);
    if (await findByEmail(email)) {
        throw fault({ code: 409, message: "EMAIL_TAKEN", cause: "Email already registered" });
    }
    return createUser({ ...input, email, name: input.name.trim() });
};

export const login = async (email: string, password: string) => {
    const user = await findByEmail(normalizeEmail(email));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw fault({ code: 401, message: "INVALID_CREDENTIALS", cause: "Wrong email or password" });
    }
    return user;
};

