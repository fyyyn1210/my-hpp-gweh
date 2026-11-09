import { FREE_NUMBER_MAX, MONEY_TOLERANCE, PERCENT_TOLERANCE, QUANTITY_WORDS } from "#src/utils/assistant.constant.js";

const NUMBER = /(\d+(?:[.,]\d+)*)\s*([a-z%]*)/gi;
const SCALE: Record<string, number> = { ribu: 1e3, rb: 1e3, k: 1e3, juta: 1e6, jt: 1e6 };

export const numbersIn = (text: string) =>
    [...text.matchAll(NUMBER)].map((match) => {
        const suffix = (match[2] ?? "").toLowerCase();
        const value = Number(match[1].replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) * (SCALE[suffix] ?? 1);
        return { value, percent: suffix === "%" || suffix === "persen", quantity: QUANTITY_WORDS.has(suffix) };
    });

const collect = (source: unknown, out: number[]) => {
    if (typeof source === "number") out.push(Math.abs(source));
    else if (typeof source === "string") out.push(...numbersIn(source).map((item) => item.value));
    else if (source && typeof source === "object") for (const value of Object.values(source)) collect(value, out);
    return out;
};

const near = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;

export const isGrounded = (text: string, sources: unknown[]) => {
    const known = collect(sources, []);
    return numbersIn(text).every(({ value, percent, quantity }) =>
        quantity ||
        (percent
            ? known.some((item) => near(item * 100, value, PERCENT_TOLERANCE) || near(item, value, PERCENT_TOLERANCE))
            : value <= FREE_NUMBER_MAX || known.some((item) => near(item, value, Math.abs(item) * MONEY_TOLERANCE))),
    );
};
