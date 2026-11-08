import { sql } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { commodities } from "#src/drizzle/schemas/index.js";
import { CATALOG, type CatalogCommodity } from "#src/drizzle/seeds/catalog.js";
import { ingestPrices, type PriceRow } from "#src/modules/commodities/commodity.service.js";
import { dateOfDay } from "#src/utils/date.util.js";
import { dummyPihpsSeries } from "#src/modules/commodities/pihps.dummy.js";
import { PriceSource } from "#src/utils/hpp.constant.js";

export const dummyPihpsRows = (commodity: CatalogCommodity, today = new Date()): PriceRow[] =>
    dummyPihpsSeries(commodity).map((price, day) => ({ commodityId: commodity.id, source: PriceSource.Pihps, price, priceDate: dateOfDay(day, today) }));

export const upsertCatalog = async () => {
    await db.insert(commodities)
        .values(CATALOG.map((item, index) => ({
            id: item.id,
            name: item.name,
            icon: item.icon,
            priceUnit: item.priceUnit,
            aliases: item.aliases,
            unitOverrides: item.unitOverrides ?? {},
            sortOrder: index,
        })))
        .onConflictDoUpdate({
            target: commodities.id,
            set: {
                name: sql`excluded.name`,
                icon: sql`excluded.icon`,
                priceUnit: sql`excluded.price_unit`,
                aliases: sql`excluded.aliases`,
                unitOverrides: sql`excluded.unit_overrides`,
                sortOrder: sql`excluded.sort_order`,
            },
        });
};

export const ingestDummyPihps = () => ingestPrices(CATALOG.flatMap((item) => dummyPihpsRows(item)));
