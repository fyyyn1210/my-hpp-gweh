import { eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { users, type User } from "#src/drizzle/schemas/index.js";
import { fault } from "#src/utils/response.util.js";

export const toProfile = ({ passwordHash, ...user }: User) => user;

export const findUser = async (id: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) throw fault({ code: 401, message: "UNAUTHORIZED", cause: "User no longer exists" });
    return user;
};

export const updateProfile = async (id: string, patch: Partial<Pick<User, "name" | "city" | "shareCommunity" | "roundingStep" | "notifyInApp" | "notifyTelegram">>) => {
    if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, id));
    return toProfile(await findUser(id));
};
