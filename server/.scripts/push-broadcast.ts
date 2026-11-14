import { eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { pushTokens, users } from "#src/drizzle/schemas/index.js";
import { pushEnabled } from "#src/modules/push/push.provider.js";
import { pushBroadcast } from "#src/modules/push/push.service.js";

const [title = "Hai, harga pasar hari ini", body = "Harga cabai rawit, bawang merah, dan telur sudah diperbarui. Cek modal menu Anda."] = process.argv.slice(2);

if (!pushEnabled) {
    console.error("Firebase is not configured: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY must be set in server .env");
    process.exit(1);
}

console.log(`Users: ${await db.$count(users)}, push enabled users: ${await db.$count(users, eq(users.notifyPush, true))}, device tokens: ${await db.$count(pushTokens)}`);

const sent = await pushBroadcast(title, body);
console.log(`Push sent: ${sent}`);
process.exit(0);
