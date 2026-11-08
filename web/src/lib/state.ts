import { reactive, watch } from "vue";
import { COMMODITY_MAP, commoditySeries } from "@/data/commodities";
import { SEED_MENUS } from "@/data/menus";
import { SEED_NOTAS } from "@/data/notas";
import { CITIES, ROUNDING_STEPS, STORAGE_KEY, TODAY } from "./constants";
import type { Menu, Nota } from "./types";

export interface PersistedState {
  menus: Menu[];
  notas: Nota[];
  readAlarms: string[];
  onboardingDone: boolean;
  ownerName: string;
  city: string;
  shareCommunity: boolean;
  roundingStep: number;
  telegramLinked: boolean;
  telegramCode: string;
  notifyInApp: boolean;
  notifyTelegram: boolean;
}

const seedNotas = (): Nota[] =>
  SEED_NOTAS.map((seed, index) => {
    const day = TODAY - seed.daysAgo;
    const pihps = commoditySeries(COMMODITY_MAP[seed.commodityId])[day];
    return {
      id: `nota-seed-${index}`,
      commodityId: seed.commodityId,
      pricePerKg: Math.round((pihps * seed.ratio) / 500) * 500,
      day,
      shared: seed.shared,
    };
  });

export const defaults = (): PersistedState => ({
  menus: structuredClone(SEED_MENUS),
  notas: seedNotas(),
  readAlarms: [],
  onboardingDone: false,
  ownerName: "Bu Sari",
  city: CITIES[0],
  shareCommunity: true,
  roundingStep: ROUNDING_STEPS[0],
  telegramLinked: false,
  telegramCode: "",
  notifyInApp: true,
  notifyTelegram: true,
});

const load = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
};

export const state = reactive<PersistedState>(load());

watch(state, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true });
