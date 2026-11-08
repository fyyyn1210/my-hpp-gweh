import type { CatalogCommodity } from "#src/drizzle/seeds/catalog.js";
import { TODAY } from "#src/utils/hpp.constant.js";

export const dummyPihpsSeries = (commodity: CatalogCommodity) =>
    Array.from({ length: TODAY + 1 }, (_, day) => {
        const progress = Math.pow(day / TODAY, 2.2);
        const wave =
            Math.sin(day * 0.9 + commodity.seed) * commodity.volatility +
            Math.sin(day * 0.37 + commodity.seed * 2) * commodity.volatility * 0.6;
        const price = commodity.basePrice * (1 + commodity.trend * progress) * (1 + wave);
        return Math.round(price / 50) * 50;
    });
