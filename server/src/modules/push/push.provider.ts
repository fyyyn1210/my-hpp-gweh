import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import env from "#src/configs/env.config.js";
import { PUSH_INVALID_TOKEN_CODES, PUSH_MULTICAST_MAX, PUSH_TTL_SECONDS, type PushKind } from "#src/utils/push.constant.js";

export interface PushMessage {
    kind: PushKind;
    title: string;
    body: string;
    url: string;
}

export const pushEnabled = Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

const messaging = () =>
    getMessaging(getApps()[0] ?? initializeApp({
        credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    }));

export const sendPush = async (tokens: string[], message: PushMessage) => {
    const invalid: string[] = [];
    let sent = 0;
    for (let start = 0; start < tokens.length; start += PUSH_MULTICAST_MAX) {
        const batch = tokens.slice(start, start + PUSH_MULTICAST_MAX);
        const result = await messaging().sendEachForMulticast({
            tokens: batch,
            data: { kind: message.kind, title: message.title, body: message.body, url: message.url },
            webpush: { headers: { TTL: String(PUSH_TTL_SECONDS), Urgency: "high" } },
        });
        sent += result.successCount;
        result.responses.forEach((item, index) => {
            if (!item.success && PUSH_INVALID_TOKEN_CODES.includes(item.error?.code ?? "")) invalid.push(batch[index]);
        });
    }
    return { sent, invalid };
};
