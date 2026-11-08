import { Food, MANUAL_PRICE_HINTS, UNIT_ALIASES, Unit } from "#src/utils/hpp.constant.js";

export interface ParserCommodity {
    id: string;
    name: string;
    icon: string;
    aliases: string[];
}

export interface ParsedIngredient {
    name: string;
    icon: string;
    qty: number;
    unit: Unit;
    commodityId: string | null;
    manualPricePerKg: number | null;
    needsCheck: boolean;
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, setengah: 0.5 };

export const findCommodity = <T extends ParserCommodity>(name: string, commodities: T[]): T | null => {
    const lowered = name.toLowerCase();
    let best: { commodity: T; length: number } | null = null;
    for (const commodity of commodities) {
        for (const alias of commodity.aliases) {
            if (lowered.includes(alias) && (!best || alias.length > best.length)) best = { commodity, length: alias.length };
        }
    }
    return best?.commodity ?? null;
};

const parseQty = (raw: string): number | null => {
    const text = raw.trim().toLowerCase().replace(",", ".");
    if (FRACTIONS[text] !== undefined) return FRACTIONS[text];
    const mixed = text.match(/^(\d+)\s*(½|¼|¾)$/);
    if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];
    const fraction = text.match(/^(\d+)\/(\d+)$/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    const number = Number(text);
    return Number.isFinite(number) && text !== "" ? number : null;
};

export const parseRecipeText = (text: string, commodities: ParserCommodity[]): ParsedIngredient[] => {
    const lines = text
        .split(/\n|;|,(?=\s*\d)/)
        .map((line) => line.replace(/^[\s\-*•\d.)]+(?=\D)/, (match) => (/\d/.test(match) ? match : "")).trim())
        .filter(Boolean);
    return lines.map((line) => {
        const match = line.match(/^(\d+(?:[.,]\d+)?(?:\s*[½¼¾]|\/\d+)?|½|¼|¾|setengah)\s*([a-zA-Z]+)?\s+(.+)$/i);
        let qty: number | null = 1;
        let unit = Unit.Sdm;
        let name = line;
        let needsCheck = true;
        if (match) {
            qty = parseQty(match[1]);
            const unitWord = (match[2] ?? "").toLowerCase();
            needsCheck = !(unitWord && UNIT_ALIASES[unitWord]);
            unit = needsCheck ? Unit.Buah : UNIT_ALIASES[unitWord];
            name = needsCheck ? `${match[2] ?? ""} ${match[3]}`.trim() : match[3];
        }
        if (qty === null) {
            qty = 1;
            needsCheck = true;
        }
        name = name.replace(/\s+/g, " ").trim();
        const commodity = findCommodity(name, commodities);
        const hintKey = Object.keys(MANUAL_PRICE_HINTS).find((key) => name.toLowerCase().includes(key));
        const hint = hintKey ? MANUAL_PRICE_HINTS[hintKey] : null;
        return {
            name: commodity ? commodity.name : hint ? hint.name : name.charAt(0).toUpperCase() + name.slice(1),
            icon: commodity ? commodity.icon : hint ? hint.icon : Food.Ingredient,
            qty,
            unit,
            commodityId: commodity ? commodity.id : null,
            manualPricePerKg: commodity ? null : hint ? hint.pricePerKg : null,
            needsCheck: needsCheck || (!commodity && !hint),
        };
    });
};
