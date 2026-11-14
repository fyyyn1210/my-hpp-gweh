import { computed, ref, watch } from "vue";
import { COMMODITIES, COMMODITY_MAP, setCommodities } from "@/data/commodities";
import { DEFAULT_EXTRA_COST, DEFAULT_TARGET_MARGIN, DEFAULT_THRESHOLD, Food, PROFILE_SAVE_DELAY_MS, TODAY } from "@/lib/constants";
import { commodityChange, erosion, menuMargin, vulnerability, type Vulnerability } from "@/lib/engine";
import { api, dayOf, errorText } from "@/lib/api";
import { defaults, state } from "@/lib/state";
import type { AlarmItem, Commodity, Ingredient, Menu, Nota, Profile, Vote } from "@/lib/types";

type Dated<T, K extends string> = Omit<T, "day" | "priceSetDay" | "createdDay" | "read"> & Record<K, string>;
type MenuDto = Omit<Dated<Menu, "priceSetAt" | "createdAt">, "ingredients"> & { ingredients: Ingredient[] };
type Session = { user: Profile; accessToken: string; refreshToken: string };

const toast = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const loaded = ref(false);
const alarms = ref<AlarmItem[]>([]);

const showToast = (message: string) => {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), 2600);
};

const report = (error: unknown) => showToast(errorText(error));

const fromMenu = ({ priceSetAt, createdAt, ...menu }: MenuDto): Menu => ({ ...menu, priceSetDay: dayOf(priceSetAt), createdDay: dayOf(createdAt) });
const fromNota = ({ recordedAt, ...nota }: Dated<Nota, "recordedAt">): Nota => ({ ...nota, day: dayOf(recordedAt) });
const fromVote = ({ recordedAt, ...vote }: Dated<Vote, "recordedAt">): Vote => ({ ...vote, day: dayOf(recordedAt) });

const toIngredient = (item: Ingredient) => ({
  name: item.name.trim() || "Bahan",
  icon: item.icon,
  qty: item.qty,
  unit: item.unit,
  commodityId: item.commodityId,
  manualPricePerKg: item.manualPricePerKg === null ? null : Math.round(item.manualPricePerKg),
});

const toMenuPatch = (patch: Partial<Menu>) => ({
  ...(patch.name !== undefined && { name: patch.name }),
  ...(patch.icon !== undefined && { icon: patch.icon }),
  ...(patch.sellPrice !== undefined && { sellPrice: Math.round(patch.sellPrice) }),
  ...(patch.targetMargin !== undefined && { targetMargin: patch.targetMargin }),
  ...(patch.threshold !== undefined && { threshold: patch.threshold }),
  ...(patch.extraCost !== undefined && { extraCost: Math.round(patch.extraCost) }),
  ...(patch.ingredients !== undefined && { ingredients: patch.ingredients.map(toIngredient) }),
  ...(patch.priceSetDay !== undefined && { resetPriceDate: true }),
});

const profileOf = () => ({
  name: state.ownerName,
  city: state.city,
  shareCommunity: state.shareCommunity,
  roundingStep: state.roundingStep,
  notifyInApp: state.notifyInApp,
  notifyTelegram: state.notifyTelegram,
  notifyPush: state.notifyPush,
});

let savedProfile = "";
let profileTimer: ReturnType<typeof setTimeout> | undefined;

const applyProfile = (user: Profile) => {
  Object.assign(state, {
    session: user.email,
    ownerName: user.name,
    city: user.city,
    shareCommunity: user.shareCommunity,
    roundingStep: user.roundingStep,
    notifyInApp: user.notifyInApp,
    notifyTelegram: user.notifyTelegram,
    notifyPush: user.notifyPush,
  });
  savedProfile = JSON.stringify(profileOf());
};

const refreshAlerts = async () => {
  const items = await api<Array<Dated<AlarmItem, "createdAt"> & { read: boolean }>>("/alerts");
  alarms.value = items.map(({ createdAt, ...alarm }) => ({ ...alarm, day: dayOf(createdAt) }));
};

const refreshVotes = async () => {
  state.votes = (await api<Array<Dated<Vote, "recordedAt">>>("/commodities/community")).map(fromVote);
};

const sync = (work: Promise<unknown>) => work.then(refreshAlerts).catch(report);

watch(profileOf, (next) => {
  const snapshot = JSON.stringify(next);
  if (!state.accessToken || snapshot === savedProfile) return;
  clearTimeout(profileTimer);
  profileTimer = setTimeout(() => {
    const before = JSON.parse(savedProfile);
    const patch = Object.fromEntries(Object.entries(next).filter(([key, value]) => before[key] !== value));
    savedProfile = snapshot;
    const communityChanged = "city" in patch || "shareCommunity" in patch;
    sync(api<Profile>("/me", "PATCH", patch).then(() => (communityChanged ? refreshVotes() : undefined)));
  }, PROFILE_SAVE_DELAY_MS);
});

const load = async () => {
  const [user, commodities, votes, menus, notas] = await Promise.all([
    api<Profile>("/me"),
    api<Commodity[]>("/commodities"),
    api<Array<Dated<Vote, "recordedAt">>>("/commodities/community"),
    api<MenuDto[]>("/menus"),
    api<Array<Dated<Nota, "recordedAt">>>("/notas"),
  ]);
  applyProfile(user);
  setCommodities(commodities);
  Object.assign(state, { votes: votes.map(fromVote), menus: menus.map(fromMenu), notas: notas.map(fromNota) });
  await refreshAlerts();
  loaded.value = true;
};


const unreadCount = computed(() => alarms.value.filter((alarm) => !alarm.read).length);

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

const getMenu = (id: string) => state.menus.find((menu) => menu.id === id);

const replaceMenu = (dto: MenuDto) => {
  const index = state.menus.findIndex((menu) => menu.id === dto.id);
  if (index >= 0) state.menus[index] = fromMenu(dto);
};

const addMenu = async ({ name, icon, sellPrice, targetMargin, threshold, extraCost, ingredients }: Menu) => {
  const created = fromMenu(
    await api<MenuDto>("/menus", "POST", toMenuPatch({ name, icon, sellPrice, targetMargin, threshold, extraCost, ingredients })),
  );
  state.menus.unshift(created);
  sync(Promise.resolve());
  return created.id;
};

const updateMenu = (id: string, patch: Partial<Menu>) => {
  const menu = getMenu(id);
  if (!menu) return;
  Object.assign(menu, patch);
  sync(api<MenuDto>(`/menus/${id}`, "PATCH", toMenuPatch(patch)).then(replaceMenu));
};

const setSellPrice = (id: string, sellPrice: number) => updateMenu(id, { sellPrice, priceSetDay: TODAY });

const removeMenu = (id: string) => {
  state.menus = state.menus.filter((menu) => menu.id !== id);
  sync(api(`/menus/${id}`, "DELETE"));
};

const addNota = (nota: Omit<Nota, "id" | "day">) =>
  sync(
    api<Dated<Nota, "recordedAt">>("/notas", "POST", nota).then((created) => {
      state.notas.unshift(fromNota(created));
      showToast(`Harga ${COMMODITY_MAP[nota.commodityId].name.toLowerCase()} tersimpan`);
    }),
  );

const removeNota = (id: string) => {
  state.notas = state.notas.filter((nota) => nota.id !== id);
  sync(api(`/notas/${id}`, "DELETE"));
};

const markRead = (ids: string[]) => {
  if (ids.length === 0) return;
  for (const alarm of alarms.value) if (ids.includes(alarm.id)) alarm.read = true;
  api("/alerts/read", "POST", { ids }).catch(report);
};

const markAlarmRead = (id: string) => markRead(alarms.value.some((alarm) => alarm.id === id && !alarm.read) ? [id] : []);

const markAllRead = () => markRead(alarms.value.filter((alarm) => !alarm.read).map((alarm) => alarm.id));

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

const signIn = async (request: Promise<Session>) => {
  try {
    const { user, accessToken, refreshToken } = await request;
    Object.assign(state, { accessToken, refreshToken, onboardingDone: true });
    applyProfile(user);
    await load();
    showToast(`Selamat datang, ${user.name}`);
    return null;
  } catch (error) {
    return errorText(error);
  }
};

const register = (account: { email: string; name: string; city: string; shareCommunity: boolean }, password: string) =>
  signIn(api<Session>("/auth/register", "POST", { ...account, password }));

const login = (email: string, password: string) => signIn(api<Session>("/auth/login", "POST", { email, password }));

const logout = () => {
  const { onboardingDone, telegramLinked, telegramCode } = state;
  Object.assign(state, defaults(), { onboardingDone, telegramLinked, telegramCode });
  alarms.value = [];
  loaded.value = false;
};

const newMenuTemplate = (): Omit<Menu, "id"> => ({
  name: "",
  icon: Food.Dish,
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
  loaded,
  alarms,
  unreadCount,
  ranking,
  averageMargin,
  averageErosion,
  risingCommodities,
  commodities: COMMODITIES,
  commodityMap: COMMODITY_MAP,
  load,
  report,
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
  register,
  login,
  logout,
  newMenuTemplate,
});
