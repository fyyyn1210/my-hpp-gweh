import { commodityChange, erosion, menuMargin, statusOf, type BookMenu, type PriceBook } from "#src/modules/hpp/hpp.engine.js";
import { dayLabel, percent, points, rupiah } from "#src/utils/format.util.js";
import { AlertKind, Status, SURGE_LOSS, SURGE_THRESHOLD, TODAY, WEEK } from "#src/utils/hpp.constant.js";

export interface Alert {
    id: string;
    kind: AlertKind;
    title: string;
    detail: string;
    menuIds: string[];
    commodityId?: string;
    severity: Status;
}

const RANK = { [Status.Loss]: 0, [Status.Warning]: 1, [Status.Safe]: 2 };

export const buildAlerts = (book: PriceBook, menus: BookMenu[]): Alert[] => {
    const items: Alert[] = [];
    for (const commodity of Object.values(book.commodities)) {
        const change = commodityChange(book, commodity, TODAY - WEEK);
        if (change < SURGE_THRESHOLD) continue;
        const affected = menus.filter((menu) => menu.ingredients.some((ingredient) => ingredient.commodityId === commodity.id));
        if (affected.length === 0) continue;
        items.push({
            id: `surge-${commodity.id}`,
            kind: AlertKind.PriceSurge,
            title: `${commodity.name} naik ${percent(change, 0)} minggu ini`,
            detail: `${affected.length} menu Anda memakai bahan ini: ${affected.map((menu) => menu.name).join(", ")}.`,
            menuIds: affected.map((menu) => menu.id),
            commodityId: commodity.id,
            severity: change >= SURGE_LOSS ? Status.Loss : Status.Warning,
        });
    }
    for (const menu of menus) {
        const status = statusOf(book, menu);
        if (status === Status.Safe) continue;
        items.push({
            id: `margin-${menu.id}`,
            kind: AlertKind.MarginDrop,
            title: status === Status.Loss ? `${menu.name} sekarang rugi` : `Untung ${menu.name} tinggal ${percent(menuMargin(book, menu), 0)}`,
            detail: `Turun ${points(erosion(book, menu))} sejak harga ${rupiah(menu.sellPrice)} ditetapkan ${dayLabel(menu.priceSetDay)}. Batas aman Anda ${percent(menu.threshold, 0)}.`,
            menuIds: [menu.id],
            severity: status,
        });
    }
    return items.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
};
