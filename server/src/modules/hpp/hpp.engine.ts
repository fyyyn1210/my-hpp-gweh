import {
    COMMUNITY_MIN,
    COMMUNITY_WINDOW,
    NOTA_MAX_AGE,
    OUTLIER_HIGH,
    OUTLIER_LOW,
    PriceSource,
    Status,
    TODAY,
    UNIT_GRAMS,
    type Unit,
} from "#src/utils/hpp.constant.js";

export interface BookCommodity {
    id: string;
    name: string;
    prices: number[];
    unitOverrides: Partial<Record<Unit, number>>;
}

export interface BookNota {
    commodityId: string;
    pricePerKg: number;
    day: number;
    shared: boolean;
}

export interface BookVote {
    commodityId: string;
    pricePerKg: number;
    day: number;
}

export interface BookIngredient {
    qty: number;
    unit: Unit;
    commodityId: string | null;
    manualPricePerKg: number | null;
}

export interface BookMenu {
    id: string;
    name: string;
    sellPrice: number;
    priceSetDay: number;
    threshold: number;
    extraCost: number;
    ingredients: BookIngredient[];
}

export interface PriceBook {
    commodities: Record<string, BookCommodity>;
    notas: BookNota[];
    votes: BookVote[];
    shareCommunity: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const inWindow = (day: number, at: number, span: number) => day <= at && at - day < span;

export const pihpsPrice = (commodity: BookCommodity, day = TODAY) => commodity.prices[clamp(day, 0, TODAY)];

export const calibrationOf = (book: PriceBook, commodity: BookCommodity) => {
    const ratios = book.notas
        .filter((nota) => nota.commodityId === commodity.id)
        .map((nota) => nota.pricePerKg / pihpsPrice(commodity, nota.day));
    return ratios.length ? median(ratios) : 1;
};

export const latestNota = (book: PriceBook, commodityId: string, day = TODAY) =>
    book.notas
        .filter((nota) => nota.commodityId === commodityId && inWindow(nota.day, day, NOTA_MAX_AGE + 1))
        .sort((a, b) => b.day - a.day)[0] ?? null;

export const communityStats = (book: PriceBook, commodity: BookCommodity, day = TODAY) => {
    const votes = book.votes
        .filter((vote) => vote.commodityId === commodity.id && inWindow(vote.day, day, COMMUNITY_WINDOW))
        .map((vote) => vote.pricePerKg);
    if (book.shareCommunity) {
        const own = book.notas
            .filter((nota) => nota.shared && nota.commodityId === commodity.id && inWindow(nota.day, day, COMMUNITY_WINDOW))
            .sort((a, b) => b.day - a.day)[0];
        if (own) votes.push(own.pricePerKg);
    }
    const reference = pihpsPrice(commodity, day);
    const kept = votes.filter((price) => price >= reference * OUTLIER_LOW && price <= reference * OUTLIER_HIGH);
    if (kept.length < COMMUNITY_MIN) return null;
    return { median: median(kept), count: kept.length, dropped: votes.length - kept.length };
};

export const priceInfo = (book: PriceBook, commodity: BookCommodity, day = TODAY) => {
    const nota = latestNota(book, commodity.id, day);
    if (nota) return { price: nota.pricePerKg, source: PriceSource.Nota, day: nota.day };
    const community = communityStats(book, commodity, day);
    if (community) return { price: community.median, source: PriceSource.Community, day };
    return { price: pihpsPrice(commodity, day) * calibrationOf(book, commodity), source: PriceSource.Pihps, day };
};

export const commodityPrice = (book: PriceBook, commodity: BookCommodity, day = TODAY) => priceInfo(book, commodity, day).price;

export const commodityChange = (book: PriceBook, commodity: BookCommodity, fromDay: number, toDay = TODAY) => {
    const from = commodityPrice(book, commodity, fromDay);
    const to = commodityPrice(book, commodity, toDay);
    return from === 0 ? 0 : (to - from) / from;
};

export const gramsOf = (book: PriceBook, ingredient: BookIngredient) => {
    const override = ingredient.commodityId ? book.commodities[ingredient.commodityId]?.unitOverrides[ingredient.unit] : undefined;
    return ingredient.qty * (override ?? UNIT_GRAMS[ingredient.unit]);
};

export const ingredientCost = (book: PriceBook, ingredient: BookIngredient, day = TODAY) => {
    const commodity = ingredient.commodityId ? book.commodities[ingredient.commodityId] : null;
    const pricePerKg = commodity ? commodityPrice(book, commodity, day) : ingredient.manualPricePerKg ?? 0;
    return (gramsOf(book, ingredient) / 1000) * pricePerKg;
};

export const hpp = (book: PriceBook, menu: BookMenu, day = TODAY) =>
    menu.ingredients.reduce((sum, ingredient) => sum + ingredientCost(book, ingredient, day), 0) + menu.extraCost;

export const marginOf = (sellPrice: number, cost: number) => (sellPrice <= 0 ? 0 : (sellPrice - cost) / sellPrice);

export const menuMargin = (book: PriceBook, menu: BookMenu, day = TODAY) => marginOf(menu.sellPrice, hpp(book, menu, day));

export const statusOf = (book: PriceBook, menu: BookMenu, day = TODAY) => {
    const margin = menuMargin(book, menu, day);
    if (margin < 0) return Status.Loss;
    if (margin < menu.threshold) return Status.Warning;
    return Status.Safe;
};

export const erosion = (book: PriceBook, menu: BookMenu) => menuMargin(book, menu, menu.priceSetDay) - menuMargin(book, menu);
