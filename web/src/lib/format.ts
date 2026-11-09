import { MS_PER_DAY, TODAY } from "./constants";

export const thousands = (value: number) => Math.round(value).toLocaleString("id-ID");

export const rupiah = (value: number) => `Rp ${thousands(value)}`;

export const percent = (fraction: number, digits = 0) =>
  `${(fraction * 100).toFixed(digits).replace(".", ",")}%`;

export const points = (fraction: number, digits = 0) => `${(fraction * 100).toFixed(digits).replace(".", ",")} poin`;

export const signedPercent = (fraction: number, digits = 1) =>
  `${fraction > 0 ? "+" : fraction < 0 ? "-" : ""}${percent(Math.abs(fraction), digits)}`;

export const shortDate = (date: Date) =>
  date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

export const dateTime = (date: Date) =>
  `${shortDate(date)} · ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

export const longDate = (date: Date) =>
  date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const dayDate = (day: number) => new Date(Date.now() - (TODAY - day) * MS_PER_DAY);

export const dayLabel = (day: number) => (day === TODAY ? "hari ini" : day === TODAY - 1 ? "kemarin" : shortDate(dayDate(day)));

export const dateInput = (date: Date) => date.toLocaleDateString("en-CA");
