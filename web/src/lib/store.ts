import { computed, ref } from "vue";
import { COMMODITIES, COMMODITY_MAP } from "@/data/commodities";
import {
  DEFAULT_EXTRA_COST,
  DEFAULT_TARGET_MARGIN,
  DEFAULT_THRESHOLD,
  SURGE_THRESHOLD,
  TODAY,
  WEEK,
} from "@/lib/constants";
import {
  commodityChange,
  erosion,
  hpp,
  menuMargin,
  statusOf,
  vulnerability,
  type Vulnerability,
} from "@/lib/engine";
import { dayLabel, percent, points, rupiah, uid } from "@/lib/format";
import { defaults, state } from "@/lib/state";
import { AlarmKind, Status, type AlarmItem, type Menu, type Nota } from "@/lib/types";

const toast = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;


const alarms = computed<AlarmItem[]>(() => {
  const items: AlarmItem[] = [];
  for (const commodity of COMMODITIES) {
    const change = commodityChange(commodity, TODAY - WEEK);
    if (change < SURGE_THRESHOLD) continue;
    const affected = state.menus.filter((menu) =>
      menu.ingredients.some((ingredient) => ingredient.commodityId === commodity.id),
    );
    if (affected.length === 0) continue;
    items.push({
      id: `surge-${commodity.id}`,
      kind: AlarmKind.PriceSurge,
      title: `${commodity.name} naik ${percent(change, 0)} minggu ini`,
      detail: `${affected.length} menu Anda memakai bahan ini: ${affected.map((menu) => menu.name).join(", ")}.`,
      day: TODAY,
      menuIds: affected.map((menu) => menu.id),
      commodityId: commodity.id,
      severity: change >= 0.2 ? Status.Loss : Status.Warning,
      active: true,
    });
  }
  for (const menu of state.menus) {
    const status = statusOf(menu);
    if (status === Status.Safe) continue;
    items.push({
      id: `margin-${menu.id}`,
      kind: AlarmKind.MarginDrop,
      title:
        status === Status.Loss
          ? `${menu.name} sekarang rugi`
          : `Untung ${menu.name} tinggal ${percent(menuMargin(menu), 0)}`,
      detail: `Turun ${points(erosion(menu))} sejak harga ${rupiah(menu.sellPrice)} ditetapkan ${dayLabel(menu.priceSetDay)}. Batas aman Anda ${percent(menu.threshold, 0)}.`,
      day: TODAY,
      menuIds: [menu.id],
      severity: status,
      active: true,
    });
  }
  const rank = { [Status.Loss]: 0, [Status.Warning]: 1, [Status.Safe]: 2 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
});

const unreadCount = computed(() => alarms.value.filter((alarm) => !state.readAlarms.includes(alarm.id)).length);

const ranking = computed<Array<{ menu: Menu; vuln: Vulnerability }>>(() =>
  state.menus
    .map((menu) => ({ menu, vuln: vulnerability(menu) }))
    .sort((a, b) => b.vuln.score - a.vuln.score),
);

const averageErosion = computed(() =>
  state.menus.length === 0 ? 0 : state.menus.reduce((sum, menu) => sum + erosion(menu), 0) / state.menus.length,
);

const averageMargin = computed(() =>
  state.menus.length === 0
    ? 0
    : state.menus.reduce((sum, menu) => sum + menuMargin(menu), 0) / state.menus.length,
);

const risingCommodities = computed(() =>
  COMMODITIES.map((commodity) => ({ commodity, change: commodityChange(commodity, TODAY - 1) }))
    .filter((item) => item.change > 0)
    .sort((a, b) => b.change - a.change),
);

const showToast = (message: string) => {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), 2600);
};

const getMenu = (id: string) => state.menus.find((menu) => menu.id === id);

const addMenu = (menu: Menu) => {
  state.menus.unshift({ ...menu, priceSetDay: TODAY, custom: true });
};

const setSellPrice = (id: string, sellPrice: number) => updateMenu(id, { sellPrice, priceSetDay: TODAY });

const addNota = (nota: Omit<Nota, "id" | "day">) => {
  state.notas.unshift({ ...nota, id: uid("nota"), day: TODAY });
  showToast(`Harga ${COMMODITY_MAP[nota.commodityId].name.toLowerCase()} tersimpan`);
};

const removeNota = (id: string) => {
  state.notas = state.notas.filter((nota) => nota.id !== id);
};

const updateMenu = (id: string, patch: Partial<Menu>) => {
  const menu = getMenu(id);
  if (menu) Object.assign(menu, patch);
};

const removeMenu = (id: string) => {
  state.menus = state.menus.filter((menu) => menu.id !== id);
};

const markAlarmRead = (id: string) => {
  if (!state.readAlarms.includes(id)) state.readAlarms.push(id);
};

const markAllRead = () => {
  for (const alarm of alarms.value) markAlarmRead(alarm.id);
};

const linkTelegram = () => {
  state.telegramCode = Math.random().toString(36).slice(2, 8).toUpperCase();
};

const confirmTelegram = () => {
  state.telegramLinked = true;
  showToast("Telegram tersambung (contoh)");
};

const unlinkTelegram = () => {
  state.telegramLinked = false;
  state.telegramCode = "";
};

const resetDemo = () => {
  Object.assign(state, defaults(), { onboardingDone: true });
  showToast("Data contoh dikembalikan");
};

const newMenuTemplate = (): Omit<Menu, "id"> => ({
  name: "",
  emoji: "🍽️",
  sellPrice: 15000,
  priceSetDay: TODAY,
  targetMargin: DEFAULT_TARGET_MARGIN,
  threshold: DEFAULT_THRESHOLD,
  extraCost: DEFAULT_EXTRA_COST,
  ingredients: [],
});

export const useStore = () => ({
  state,
  toast,
  alarms,
  unreadCount,
  ranking,
  averageMargin,
  averageErosion,
  risingCommodities,
  commodities: COMMODITIES,
  commodityMap: COMMODITY_MAP,
  showToast,
  getMenu,
  addMenu,
  updateMenu,
  setSellPrice,
  addNota,
  removeNota,
  removeMenu,
  markAlarmRead,
  markAllRead,
  linkTelegram,
  confirmTelegram,
  unlinkTelegram,
  resetDemo,
  newMenuTemplate,
});
