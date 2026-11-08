import { dateOfDay } from "#src/utils/date.util.js";
import { TODAY } from "#src/utils/hpp.constant.js";

export const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

export const percent = (fraction: number, digits = 0) => `${(fraction * 100).toFixed(digits).replace(".", ",")}%`;

export const points = (fraction: number, digits = 0) => `${(fraction * 100).toFixed(digits).replace(".", ",")} poin`;

export const dayLabel = (day: number) =>
    day === TODAY ? "hari ini" : day === TODAY - 1 ? "kemarin" : dateOfDay(day).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
