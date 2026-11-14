import { api, ApiError } from "./api";
import { SERVICE_WORKER_URL } from "./constants";

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
const vapidKey: string | undefined = env.VITE_FIREBASE_VAPID_KEY;

export const registerServiceWorker = () =>
  "serviceWorker" in navigator ? navigator.serviceWorker.register(SERVICE_WORKER_URL).catch(() => null) : Promise.resolve(null);

export const enablePush = async () => {
  const [{ getApps, initializeApp }, { getMessaging, getToken, isSupported }] = await Promise.all([import("firebase/app"), import("firebase/messaging")]);
  if (!Object.values(config).every(Boolean) || !vapidKey || !("Notification" in window) || !(await isSupported())) throw new ApiError("PUSH_UNSUPPORTED", 0);
  if ((await Notification.requestPermission()) !== "granted") throw new ApiError("PUSH_DENIED", 0);
  const registration = await registerServiceWorker();
  if (!registration) throw new ApiError("PUSH_UNSUPPORTED", 0);
  const token = await getToken(getMessaging(getApps()[0] ?? initializeApp(config)), { vapidKey, serviceWorkerRegistration: registration });
  await api("/push/tokens", "POST", { token });
};

export const testPush = () => api("/push/test", "POST");
