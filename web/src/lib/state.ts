import { reactive, watch } from "vue";
import { CITIES, ROUNDING_STEPS, STORAGE_KEY } from "./constants";
import type { Menu, Nota, Vote } from "./types";

export interface PersistedState {
  onboardingDone: boolean;
  session: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  telegramLinked: boolean;
  telegramCode: string;
}

export interface AppState extends PersistedState {
  menus: Menu[];
  notas: Nota[];
  votes: Vote[];
  ownerName: string;
  city: string;
  shareCommunity: boolean;
  roundingStep: number;
  notifyInApp: boolean;
  notifyTelegram: boolean;
}

const PERSISTED: Array<keyof PersistedState> = ["onboardingDone", "session", "accessToken", "refreshToken", "telegramLinked", "telegramCode"];

export const defaults = (): AppState => ({
  onboardingDone: false,
  session: null,
  accessToken: null,
  refreshToken: null,
  telegramLinked: false,
  telegramCode: "",
  menus: [],
  notas: [],
  votes: [],
  ownerName: "",
  city: CITIES[0],
  shareCommunity: true,
  roundingStep: ROUNDING_STEPS[0],
  notifyInApp: true,
  notifyTelegram: true,
});

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
};

export const state = reactive<AppState>(load());

watch(
  () => PERSISTED.map((key) => state[key]),
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(PERSISTED.map((key) => [key, state[key]]))));
    } catch {}
  },
);
