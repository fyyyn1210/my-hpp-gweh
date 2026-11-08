export const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

export const percent = (fraction: number, digits = 0) =>
  `${(fraction * 100).toFixed(digits).replace(".", ",")}%`;

export const signedPercent = (fraction: number, digits = 1) =>
  `${fraction > 0 ? "+" : fraction < 0 ? "-" : ""}${percent(Math.abs(fraction), digits)}`;

export const shortDate = (date: Date) =>
  date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

export const longDate = (date: Date) =>
  date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
