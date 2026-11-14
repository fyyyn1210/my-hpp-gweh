import { reactive } from "vue";
import { api, ApiError, stream } from "./api";
import { COMMODITIES } from "@/data/commodities";
import { explanation, findCommodity, menuMargin, statusOf } from "./engine";
import { BUY_UNITS, MS_PER_DAY, PORTION_CHOICES } from "./constants";
import { percent, rupiah, uid } from "./format";
import { state } from "./state";
import { Status, type Ingredient, type Menu } from "./types";

export enum CardKind {
  Quote = "quote",
  Status = "status",
  Actions = "actions",
  Price = "price",
  NotaDraft = "nota_draft",
  PriceDraft = "price_draft",
  MenuDraft = "menu_draft",
  MenuDelete = "menu_delete",
  Ranking = "ranking",
}

export type MenuDraft = Omit<Menu, "id" | "priceSetDay" | "ingredients" | "custom"> & { ingredients: Array<Omit<Ingredient, "id">> };

export type Card =
  | { kind: CardKind.Quote; menuId: string; portions: number; daysAhead: number; margin: number }
  | { kind: CardKind.Status; menuId: string }
  | { kind: CardKind.Actions; menuId: string }
  | { kind: CardKind.Price; commodityId: string }
  | { kind: CardKind.NotaDraft; commodityId: string; amount: number; unitKey: string; total: number; done?: boolean; stale?: boolean }
  | { kind: CardKind.PriceDraft; menuId: string; price: number; done?: boolean; stale?: boolean }
  | { kind: CardKind.MenuDraft; menuId: string | null; menu: MenuDraft; recipe?: string; suggested?: boolean; batch?: number; done?: boolean; stale?: boolean }
  | { kind: CardKind.MenuDelete; menuId: string; name: string; done?: boolean; stale?: boolean }
  | { kind: CardKind.Ranking };

export interface Choice {
  label: string;
  text?: string;
  to?: string;
}

export enum StreamEvent {
  Status = "status",
  Reply = "reply",
  Error = "error",
}

export interface Step {
  text: string;
  card?: CardKind;
}

export interface ChatMessage {
  id: string;
  mine: boolean;
  animate?: boolean;
  text: string;
  card?: Card;
  choices?: Choice[];
}

interface Answer {
  text: string;
  card?: Card;
  choices?: Choice[];
  ask?: boolean;
}

const WHEN_CHOICES = [
  { label: "1 minggu lagi", days: 7 },
  { label: "2 minggu lagi", days: 14 },
  { label: "3 minggu lagi", days: 21 },
  { label: "1 bulan lagi", days: 30 },
];
const UNIT_WORDS: Record<string, string> = { kg: "kg", kilo: "kg", ons: "ons", gram: "gram", gr: "gram", liter: "liter", l: "liter" };
const SCALE: Record<string, number> = { ribu: 1e3, rb: 1e3, k: 1e3, juta: 1e6, jt: 1e6 };
const SPAN: Record<string, number> = { hari: 1, minggu: 7, bulan: 30 };
const COMMON_WORDS = new Set(["nasi", "ayam", "mie", "telur", "daging", "goreng"]);

const num = (raw: string) => Number(raw.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));

export const moneyOf = (text: string) => {
  const match =
    text.match(/(\d+(?:[.,]\d+)*)\s*(ribu|rb|k|juta|jt)\b/) ??
    text.match(/rp\.?\s*(\d+(?:[.,]\d+)*)/) ??
    text.match(/\b(\d{1,3}(?:\.\d{3})+|\d{4,})\b/);
  return match ? Math.round(num(match[1]) * (SCALE[match[2] ?? ""] ?? 1)) : null;
};

export const amountOf = (text: string) => {
  const match = text.match(/(\d+(?:[.,]\d+)?|setengah|se)\s*(kg|kilo|ons|gram|gr|liter|l)\b/);
  if (!match) return null;
  const amount = match[1] === "setengah" ? 0.5 : match[1] === "se" ? 1 : num(match[1]);
  return { amount, unitKey: UNIT_WORDS[match[2]] };
};

export const portionsOf = (text: string) => {
  const match = text.match(/(\d+)\s*(porsi|pax|box|kotak|bungkus|orang)/) ??
    text.match(/(?<!tanggal\s{0,2})\b(\d+)\b(?![.,]\d|\s*(hari|minggu|bulan|kg|kilo|ons|gram|liter|ribu|rb|k|juta|jt|%|persen))/);
  return match ? Number(match[1]) : null;
};

export const daysOf = (text: string, now = new Date()) => {
  if (/\bbesok\b/.test(text)) return 1;
  if (/\blusa\b/.test(text)) return 2;
  if (/minggu depan/.test(text)) return 7;
  if (/bulan depan/.test(text)) return 30;
  const span = text.match(/(\d+|se)\s*(hari|minggu|bulan)/);
  if (span) return (span[1] === "se" ? 1 : Number(span[1])) * SPAN[span[2]];
  const date = text.match(/tanggal\s*(\d{1,2})/);
  if (!date) return null;
  const target = new Date(now.getFullYear(), now.getMonth(), Number(date[1]));
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
};

export const marginOf = (text: string) => {
  const match = text.match(/(\d+)\s*(%|persen)/);
  return match ? Number(match[1]) / 100 : null;
};

export const menusIn = (text: string): Menu[] => {
  const scored = state.menus
    .map((menu) => {
      const hits = menu.name.toLowerCase().split(/\s+/).filter((word) => text.includes(word));
      return { menu, score: hits.length + hits.filter((word) => !COMMON_WORDS.has(word)).length };
    })
    .filter((item) => item.score > 0);
  const best = Math.max(0, ...scored.map((item) => item.score));
  return scored.filter((item) => item.score === best).map((item) => item.menu);
};

const headroom = (menu: Menu) => menuMargin(menu) - menu.threshold;
const worstMenu = () => [...state.menus].sort((a, b) => headroom(a) - headroom(b))[0] ?? null;

const pickMenu = (question: string, text: string, menus: Menu[]): Answer => ({
  text: question,
  choices: (menus.length ? menus : state.menus).map((menu) => ({ label: menu.name, text: `${text} ${menu.name.toLowerCase()}` })),
  ask: true,
});

const understand = (text: string): Answer | null => {
  const menus = menusIn(text);
  const menu = menus.length === 1 ? menus[0] : null;
  const commodity = findCommodity(text);

  if (/beli|belanja|nota|kulak/.test(text)) {
    if (!commodity) {
      const used = new Set(state.menus.flatMap((item) => item.ingredients.map((ingredient) => ingredient.commodityId)));
      return {
        text: "Bahan apa yang dibeli?",
        choices: COMMODITIES.filter((item) => used.has(item.id)).map((item) => ({ label: item.name, text: `${text} ${item.name.toLowerCase()}` })),
        ask: true,
      };
    }
    const total = moneyOf(text);
    if (!total) return { text: `Berapa total bayar ${commodity.name.toLowerCase()}? Contoh: 75 ribu.`, ask: true };
    const qty = amountOf(text) ?? { amount: 1, unitKey: commodity.priceUnit === "liter" ? "liter" : "kg" };
    const unit = BUY_UNITS.find((item) => item.key === qty.unitKey)!;
    return {
      text: `Saya siapkan catatan ${commodity.name.toLowerCase()} ${qty.amount} ${unit.label} seharga ${rupiah(total)}. Cek dulu, lalu tekan Simpan.`,
      card: { kind: CardKind.NotaDraft, commodityId: commodity.id, amount: qty.amount, unitKey: qty.unitKey, total },
    };
  }

  const price = moneyOf(text);
  if (price && /jadi|ubah|ganti|naikkan|turunkan|set/.test(text) && !/porsi|pesan|katering|acara/.test(text)) {
    if (!menu) return pickMenu("Harga menu yang mana?", text, menus);
    return {
      text: `Harga ${menu.name} mau diubah ke ${rupiah(price)}. Cek untungnya dulu, lalu tekan Simpan.`,
      card: { kind: CardKind.PriceDraft, menuId: menu.id, price },
    };
  }

  if (/pesan|katering|catering|acara|hajatan|nasi kotak|porsi/.test(text)) {
    if (!menu) return pickMenu("Menu apa yang dipesan?", text, menus);
    const portions = portionsOf(text);
    if (!portions) {
      return { text: "Berapa porsi?", choices: PORTION_CHOICES.map((value) => ({ label: `${value} porsi`, text: `${text} ${value} porsi` })), ask: true };
    }
    const daysAhead = daysOf(text);
    if (!daysAhead) {
      return { text: "Acaranya kapan?", choices: WHEN_CHOICES.map((item) => ({ label: item.label, text: `${text} ${item.days} hari` })), ask: true };
    }
    const margin = marginOf(text) ?? menu.targetMargin;
    return {
      text: `Ini hitungan ${portions} porsi ${menu.name} untuk acara ${daysAhead} hari lagi, untung ${percent(margin, 0)}. Sudah ada cadangan kalau harga bahan naik sebelum acara.`,
      card: { kind: CardKind.Quote, menuId: menu.id, portions, daysAhead: Math.max(1, daysAhead), margin },
    };
  }

  if (/kenapa|mengapa|penyebab|kok|turun/.test(text)) {
    if (!menu) return pickMenu("Menu yang mana?", text, menus);
    return { text: explanation(menu), card: { kind: CardKind.Status, menuId: menu.id } };
  }

  if (/berapa|harus|solusi|pilihan|gimana|bagaimana|saran|tindakan|naik/.test(text) && menu) {
    return { text: `Ada beberapa pilihan untuk ${menu.name}. Ketuk yang paling cocok.`, card: { kind: CardKind.Actions, menuId: menu.id } };
  }

  if (/bahaya|rentan|paling|rugi|semua menu|aman/.test(text)) {
    return { text: "Ini menu yang paling perlu diperhatikan.", card: { kind: CardKind.Ranking } };
  }

  if (commodity && /harga|berapa|mahal|murah|naik|sekarang/.test(text)) {
    return { text: `Ini harga ${commodity.name.toLowerCase()} yang saya pakai untuk menghitung modal Anda.`, card: { kind: CardKind.Price, commodityId: commodity.id } };
  }

  if (/(tambah|tambahkan|bikin|bikinin|buat|buatkan|buatin) menu|menu baru/.test(text)) {
    return { text: "Tulis resepnya di halaman Tambah menu. Saya bantu baca bahannya.", choices: [{ label: "Buka Tambah menu", to: "/menu/baru" }] };
  }

  if (menu) {
    return { text: `Untung ${menu.name} sekarang ${percent(menuMargin(menu), 0)} per porsi.`, card: { kind: CardKind.Status, menuId: menu.id } };
  }

  if (/^(halo|hai|hi|pagi|siang|sore|malam|assalam|permisi)/.test(text)) return { text: "Halo! Mau tanya apa? Pilih saran di atas kolom ketik, atau tulis sendiri." };

  return null;
};

export const suggestions = (menuId?: string): Choice[] => {
  const menu = state.menus.find((item) => item.id === menuId) ?? worstMenu();
  const texts = [
    ...(menu
      ? [`Kenapa untung ${menu.name} turun?`, `${menu.name} harus naik berapa?`, `Pesanan 100 porsi ${menu.name} 2 minggu lagi`]
      : []),
    "Menu apa yang paling bahaya?",
    "Harga cabai rawit sekarang berapa?",
    "Tadi beli cabai rawit 1 kg 75 ribu",
  ];
  return texts.map((text) => ({ label: text, text }));
};

export const greeting = (menuId?: string): ChatMessage => {
  const menu = state.menus.find((item) => item.id === menuId) ?? worstMenu();
  const alert = menu && statusOf(menu) !== Status.Safe;
  return {
    id: uid("msg"),
    mine: false,
    text: `Halo ${state.ownerName}! Mau tanya soal untung menu, harga bahan, atau pesanan?`,
  };
};

export const chat = reactive<ChatMessage[]>([]);

let pending = "";

export const respond = (input: string): ChatMessage => {
  const text = input.toLowerCase().trim();
  const combined = pending ? `${pending} ${text}` : "";
  const short = text.split(/\s+/).length <= 3;
  let source = combined && short ? combined : text;
  let answer = understand(source);
  if (!answer && combined && !short) {
    source = combined;
    answer = understand(source);
  }
  pending = answer?.ask ? source : "";
  const final: Answer = answer ?? {
    text: "Maaf, saya belum paham. Saya bisa bantu soal untung menu, harga bahan, catat belanja, dan hitung pesanan. Coba saran di atas kolom ketik.",
  };
  return { id: uid("msg"), mine: false, text: final.text, card: final.card, choices: final.choices };
};

interface Reply {
  text: string;
  cards: Card[];
  choices: Choice[];
}

interface StoredMessage extends Reply {
  id: string;
  role: string;
}

const LIMIT_NOTICE = "Jatah tanya AI hari ini sudah habis, jadi saya jawab dengan mode sederhana.";
let limitNoticed = false;

const botMessages = ({ text, cards, choices }: Reply): ChatMessage[] => {
  const [card, ...rest] = cards;
  return [
    { id: uid("msg"), mine: false, text, card, choices },
    ...rest.map((extra) => ({ id: uid("msg"), mine: false, text: "", card: extra })),
  ];
};

const DRAFT_KINDS = new Set([CardKind.NotaDraft, CardKind.PriceDraft, CardKind.MenuDraft, CardKind.MenuDelete]);

const staleDraft = (card: Card): Card => (DRAFT_KINDS.has(card.kind) ? ({ ...card, stale: true } as Card) : card);

export interface ChatSession {
  id: string;
  title: string | null;
  questions: number;
  startedAt: string;
  lastAt: string;
}

const toChat = (rows: StoredMessage[]): ChatMessage[] =>
  rows.flatMap((row) =>
    row.role === "user"
      ? [{ id: row.id, mine: true, text: row.text }]
      : botMessages({ text: row.text, cards: row.cards.map(staleDraft), choices: [] }),
  );

export const loadHistory = async () => toChat(await api<StoredMessage[]>("/assistant/messages").catch(() => []));

export const loadSessions = () => api<ChatSession[]>("/assistant/sessions");

export const loadSession = async (id: string) => toChat(await api<StoredMessage[]>(`/assistant/sessions/${id}`));

export const readPhoto = (photo: File) => {
  const form = new FormData();
  form.append("photo", photo);
  return api<{ text: string }>("/assistant/photo", "POST", form);
};

export const resetChat = () => {
  pending = "";
  chat.splice(0, chat.length);
  api("/assistant/reset", "POST").catch(() => undefined);
};

const ask = async (input: string, onStep: (step: Step) => void) => {
  let answer: Reply | null = null;
  await stream("/assistant/messages/stream", { text: input }, (event, data) => {
    if (event === StreamEvent.Status) onStep(data);
    if (event === StreamEvent.Reply) answer = data;
    if (event === StreamEvent.Error) throw new ApiError(data.message, 0);
  });
  if (!answer) throw new ApiError("UNKNOWN_ERROR", 0);
  return answer as Reply;
};

const fallback = (input: string, error: unknown): ChatMessage => {
  const local = respond(input);
  if (!(error instanceof ApiError && error.code === "AI_LIMIT_REACHED") || limitNoticed) return local;
  limitNoticed = true;
  return { ...local, text: `${LIMIT_NOTICE} ${local.text}` };
};

export const reply = async (input: string, onStep: (step: Step) => void): Promise<ChatMessage[]> => {
  try {
    const messages = botMessages(await ask(input, onStep));
    pending = "";
    messages[0].animate = true;
    return messages;
  } catch (error) {
    return [{ ...fallback(input, error), animate: true }];
  }
};
