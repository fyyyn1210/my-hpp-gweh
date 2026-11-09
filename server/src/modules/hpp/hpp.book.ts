import { communityVotes, listCommodities } from "#src/modules/commodities/commodity.service.js";
import type { BookMenu, PriceBook } from "#src/modules/hpp/hpp.engine.js";
import type { MenuDto } from "#src/modules/menus/menu.service.js";
import { listNotas } from "#src/modules/notas/nota.service.js";
import type { User } from "#src/drizzle/schemas/index.js";
import { dayIndex } from "#src/utils/date.util.js";

export const loadBook = async (user: User) => {
    const [items, notas, votes] = await Promise.all([listCommodities(), listNotas(user.id), communityVotes(user.id, user.city)]);
    return {
        commodities: Object.fromEntries(items.map((item) => [item.id, item])),
        notas: notas.map((nota) => ({ ...nota, day: dayIndex(nota.recordedAt) })),
        votes: votes.map((vote) => ({ ...vote, day: dayIndex(vote.recordedAt) })),
        shareCommunity: user.shareCommunity,
    } satisfies PriceBook;
};

export const toBookMenu = (menu: MenuDto): BookMenu => ({ ...menu, priceSetDay: dayIndex(menu.priceSetAt) });
