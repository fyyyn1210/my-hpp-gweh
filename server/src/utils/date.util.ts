import { TODAY } from "#src/utils/hpp.constant.js";

export enum ClientTimezone {
    Jakarta = "Asia/Jakarta",
    Utc = "UTC",
}

export const CLIENT_TIMEZONES = Object.values(ClientTimezone);

export const MS_PER_DAY = 86_400_000;

export const startOfDay = (date = new Date()) => new Date(Math.floor(date.getTime() / MS_PER_DAY) * MS_PER_DAY);

export const dayIndex = (date: Date, today = new Date()) =>
    TODAY - Math.round((startOfDay(today).getTime() - startOfDay(date).getTime()) / MS_PER_DAY);

export const dateOfDay = (day: number, today = new Date()) => new Date(startOfDay(today).getTime() - (TODAY - day) * MS_PER_DAY);
