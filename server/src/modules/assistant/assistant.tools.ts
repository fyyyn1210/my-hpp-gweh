import type { User } from "#src/drizzle/schemas/index.js";
import { loadBook, toBookMenu } from "#src/modules/hpp/hpp.book.js";
import { commodityChange, hpp, ingredientCost, marginOf, priceInfo, statusOf } from "#src/modules/hpp/hpp.engine.js";
import type { ToolDefinition } from "#src/modules/assistant/llm.provider.js";
import type { MenuDto } from "#src/modules/menus/menu.service.js";
import { findCommodity, parseRecipeText, type ParsedIngredient } from "#src/modules/recipes/recipe.parser.js";
import { BATCH_SMALL_UNITS, BUY_UNITS, CardKind, COMMON_MENU_WORDS, MENU_NAME_MAX, NEW_MENU_DEFAULTS, PACK_UNIT, PORTION_CHOICES, ToolName, WHEN_CHOICES } from "#src/utils/assistant.constant.js";
import { percent, rupiah } from "#src/utils/format.util.js";
import { Food, TODAY, Unit, UNIT_ALIASES, UNITS, WEEK } from "#src/utils/hpp.constant.js";

type DraftIngredient = Omit<ParsedIngredient, "needsCheck"> & { needsCheck?: boolean };

export interface MenuDraft {
    name: string;
    icon: string;
    sellPrice: number;
    targetMargin: number;
    threshold: number;
    extraCost: number;
    ingredients: DraftIngredient[];
}

export type Card =
    | { kind: CardKind.Quote; menuId: string; portions: number; daysAhead: number; margin: number }
    | { kind: CardKind.Status; menuId: string }
    | { kind: CardKind.Actions; menuId: string }
    | { kind: CardKind.Price; commodityId: string }
    | { kind: CardKind.NotaDraft; commodityId: string; amount: number; unitKey: string; total: number }
    | { kind: CardKind.PriceDraft; menuId: string; price: number }
    | { kind: CardKind.MenuDraft; menuId: string | null; menu: MenuDraft; recipe?: string; suggested?: boolean; batch?: number }
    | { kind: CardKind.MenuDelete; menuId: string; name: string }
    | { kind: CardKind.Ranking };

export interface Choice {
    label: string;
    text?: string;
    to?: string;
}

export interface ToolResult {
    text: string;
    summary?: Record<string, unknown>;
    card?: Card;
    cards?: Card[];
    choices?: Choice[];
    ask?: boolean;
}

export interface ToolContext {
    text: string;
    user: User;
    book: Awaited<ReturnType<typeof loadBook>>;
    menus: MenuDto[];
}

type Args = Record<string, unknown>;
type Commodity = ToolContext["book"]["commodities"][string];

const money = Math.round;
const fraction = (value: number) => Number(value.toFixed(3));
const positive = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
};
const words = (value: unknown) => (typeof value === "string" ? value.toLowerCase().trim() : "");
const label = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, MENU_NAME_MAX) : "");

const NEW_MENU_CHOICE: Choice = { label: "Buka Tambah menu", to: "/menu/baru" };

const matchMenus = (query: string, menus: MenuDto[]) => {
    const exact = menus.filter((menu) => menu.name.toLowerCase() === query);
    if (exact.length) return exact;
    const scored = menus
        .map((menu) => {
            const hits = menu.name.toLowerCase().split(/\s+/).filter((word) => query.includes(word));
            return { menu, score: hits.length + hits.filter((word) => !COMMON_MENU_WORDS.has(word)).length };
        })
        .filter((item) => item.score > 0);
    const best = Math.max(0, ...scored.map((item) => item.score));
    return scored.filter((item) => item.score === best).map((item) => item.menu);
};

const pickMenu = (ctx: ToolContext, args: Args, question: string): MenuDto | ToolResult => {
    if (!ctx.menus.length) return { text: "Belum ada menu. Tambah menu dulu, nanti saya bantu hitung.", choices: [NEW_MENU_CHOICE] };
    const found = matchMenus(words(args.menu) || ctx.text.toLowerCase(), ctx.menus);
    if (found.length === 1) return found[0];
    return {
        text: question,
        ask: true,
        choices: (found.length ? found : ctx.menus).map((menu) => ({ label: menu.name, text: `${ctx.text} ${menu.name.toLowerCase()}` })),
    };
};

const pickCommodity = (ctx: ToolContext, args: Args, question: string): Commodity | ToolResult => {
    const all = Object.values(ctx.book.commodities);
    const found = findCommodity(words(args.ingredient) || ctx.text, all);
    if (found) return found;
    const used = new Set(ctx.menus.flatMap((menu) => menu.ingredients.map((item) => item.commodityId)));
    const options = all.filter((item) => used.has(item.id));
    return {
        text: question,
        ask: true,
        choices: (options.length ? options : all).map((item) => ({ label: item.name, text: `${ctx.text} ${item.name.toLowerCase()}` })),
    };
};

const isResult = (value: object): value is ToolResult => "text" in value;

const menuNumbers = (ctx: ToolContext, menu: MenuDto) => {
    const book = toBookMenu(menu);
    const costNow = hpp(ctx.book, book);
    const costBefore = hpp(ctx.book, book, book.priceSetDay);
    return {
        book,
        costNow,
        marginNow: marginOf(menu.sellPrice, costNow),
        summary: {
            menu: menu.name,
            sellPrice: menu.sellPrice,
            costNow: money(costNow),
            costWhenPriceSet: money(costBefore),
            profitNow: fraction(marginOf(menu.sellPrice, costNow)),
            profitWhenPriceSet: fraction(marginOf(menu.sellPrice, costBefore)),
            safeLimit: menu.threshold,
            targetProfit: menu.targetMargin,
            status: statusOf(ctx.book, book),
        },
    };
};

const suggestedPrice = (ctx: ToolContext, cost: number, margin: number) => {
    const step = ctx.user.roundingStep;
    return Math.ceil(cost / (1 - Math.min(margin, 0.95)) / step) * step;
};

const draftCost = (ctx: ToolContext, menu: MenuDraft) => hpp(ctx.book, { ...menu, id: "draft", priceSetDay: TODAY });

const draftNumbers = (ctx: ToolContext, menu: MenuDraft) => {
    const cost = draftCost(ctx, menu);
    return {
        menu: menu.name,
        sellPrice: menu.sellPrice,
        costNow: money(cost),
        profitNow: fraction(marginOf(menu.sellPrice, cost)),
        extraCost: menu.extraCost,
        targetProfit: menu.targetMargin,
        ingredients: menu.ingredients.map((item) => `${item.qty} ${item.unit} ${item.name}`),
        noPriceYet: menu.ingredients.filter((item) => !item.commodityId && !item.manualPricePerKg).map((item) => item.name),
        saved: false,
    };
};

const parseRecipe = (ctx: ToolContext, recipe: string) => parseRecipeText(recipe, Object.values(ctx.book.commodities));

const perPortion = (item: DraftIngredient, portions: number): DraftIngredient => {
    const small = BATCH_SMALL_UNITS[item.unit];
    const unit = small ? small.unit : item.unit;
    const qty = (item.qty * (small ? small.factor : 1)) / portions;
    return { ...item, unit, qty: qty >= 10 ? Math.round(qty) : Math.round(qty * 100) / 100 };
};

const menuStatus = (ctx: ToolContext, args: Args): ToolResult => {
    const menu = pickMenu(ctx, args, "Menu yang mana?");
    if (isResult(menu)) return menu;
    const { book, marginNow, summary } = menuNumbers(ctx, menu);
    const causes = menu.ingredients
        .map((ingredient, index) => {
            const before = ingredientCost(ctx.book, book.ingredients[index], book.priceSetDay);
            const after = ingredientCost(ctx.book, book.ingredients[index]);
            return { ingredient: ingredient.name, extraPerPortion: money(after - before), change: before ? fraction((after - before) / before) : 0 };
        })
        .filter((item) => item.extraPerPortion > 0)
        .sort((a, b) => b.extraPerPortion - a.extraPerPortion)
        .slice(0, 2);
    return {
        text: `Untung ${menu.name} sekarang ${percent(marginNow)} per porsi, modalnya ${rupiah(summary.costNow)}.`,
        summary: { ...summary, biggestCauses: causes },
        card: { kind: CardKind.Status, menuId: menu.id },
    };
};

const priceOptions = (ctx: ToolContext, args: Args): ToolResult => {
    const menu = pickMenu(ctx, args, "Menu yang mana?");
    if (isResult(menu)) return menu;
    const { costNow, summary } = menuNumbers(ctx, menu);
    const suggested = suggestedPrice(ctx, costNow, menu.targetMargin);
    return {
        text: `Ada beberapa pilihan untuk ${menu.name}. Ketuk yang paling cocok.`,
        summary: { ...summary, suggestedSellPrice: suggested },
        card: { kind: CardKind.Actions, menuId: menu.id },
    };
};

const ingredientPrice = (ctx: ToolContext, args: Args): ToolResult => {
    const commodity = pickCommodity(ctx, args, "Harga bahan yang mana?");
    if (isResult(commodity)) return commodity;
    const info = priceInfo(ctx.book, commodity);
    return {
        text: `Ini harga ${commodity.name.toLowerCase()} yang saya pakai untuk menghitung modal Anda.`,
        summary: {
            ingredient: commodity.name,
            price: money(info.price),
            per: commodity.priceUnit,
            source: info.source,
            change7Days: fraction(commodityChange(ctx.book, commodity, TODAY - WEEK)),
        },
        card: { kind: CardKind.Price, commodityId: commodity.id },
    };
};

const riskyMenus = (ctx: ToolContext): ToolResult => {
    if (!ctx.menus.length) return { text: "Belum ada menu. Tambah menu dulu, nanti saya pantau.", choices: [NEW_MENU_CHOICE] };
    const ranked = ctx.menus
        .map((menu) => menuNumbers(ctx, menu).summary)
        .sort((a, b) => a.profitNow - a.safeLimit - (b.profitNow - b.safeLimit))
        .slice(0, 3)
        .map(({ menu, profitNow, safeLimit, status }) => ({ menu, profitNow, safeLimit, status }));
    return { text: "Ini menu yang paling perlu diperhatikan.", summary: { menus: ranked }, card: { kind: CardKind.Ranking } };
};

const cateringQuote = (ctx: ToolContext, args: Args): ToolResult => {
    const menu = pickMenu(ctx, args, "Menu apa yang dipesan?");
    if (isResult(menu)) return menu;
    const portions = positive(args.portions);
    if (!portions) {
        return { text: "Berapa porsi?", ask: true, choices: PORTION_CHOICES.map((value) => ({ label: `${value} porsi`, text: `${ctx.text} ${value} porsi` })) };
    }
    const daysAhead = positive(args.days_ahead);
    if (!daysAhead) {
        return { text: "Acaranya kapan?", ask: true, choices: WHEN_CHOICES.map((item) => ({ label: item.label, text: `${ctx.text} ${item.days} hari lagi` })) };
    }
    const profit = positive(args.target_profit_percent);
    const margin = profit && profit < 95 ? profit / 100 : menu.targetMargin;
    const { costNow } = menuNumbers(ctx, menu);
    const count = Math.round(portions);
    const days = Math.max(1, Math.round(daysAhead));
    return {
        text: `Ini hitungan ${count} porsi ${menu.name} untuk acara ${days} hari lagi, untung ${percent(margin)}. Sudah ada cadangan kalau harga bahan naik sebelum acara.`,
        summary: { menu: menu.name, portions: count, daysAhead: days, targetProfit: margin, costPerPortionNow: money(costNow), note: "Final price per portion and total are shown on the card" },
        card: { kind: CardKind.Quote, menuId: menu.id, portions: count, daysAhead: days, margin },
    };
};

const untrackedNota = (name: string): ToolResult => ({
    text: `${name} belum ada di daftar harga bahan, jadi belum bisa dicatat sebagai nota. Harganya bisa dimasukkan di resep menu lewat Ubah menu.`,
    summary: { ingredient: name, tracked: false, saved: false },
});

const draftNota = (ctx: ToolContext, args: Args): ToolResult => {
    const items = (Array.isArray(args.items) ? args.items : [args]).filter((item): item is Args => typeof item === "object" && item !== null);
    const named = items.filter((item) => label(item.ingredient));
    if (named.length <= 1) return draftNotaItem(ctx, named[0] ?? items[0] ?? {});
    const results = named.map((item) => draftNotaItem(ctx, item));
    const untracked = results.filter((result) => result.summary?.tracked === false).map((result) => String(result.summary?.ingredient));
    return {
        text: [...results.filter((result) => result.summary?.tracked !== false).map((result) => result.text), ...(untracked.length ? [untrackedNota(untracked.join(", ")).text] : [])].join(" "),
        summary: { items: results.map((result) => result.summary ?? { message: result.text }) },
        cards: results.flatMap((result) => (result.card ? [result.card] : [])),
    };
};

const draftNotaItem = (ctx: ToolContext, args: Args): ToolResult => {
    const named = label(args.ingredient);
    if (named && !findCommodity(named.toLowerCase(), Object.values(ctx.book.commodities))) return untrackedNota(named);
    const commodity = pickCommodity(ctx, args, "Bahan apa yang dibeli?");
    if (isResult(commodity)) return commodity;
    const total = positive(args.total_price);
    if (!total) return { text: `Berapa total bayar ${commodity.name.toLowerCase()}? Contoh: 75 ribu.`, ask: true };
    const unit = words(args.unit);
    const count = positive(args.amount) ?? 1;
    const packGrams = unit === PACK_UNIT ? commodity.unitOverrides[Unit.Buah] : undefined;
    const unitKey = packGrams ? "kg" : BUY_UNITS[unit] ? unit : commodity.priceUnit === "liter" ? "liter" : "kg";
    const amount = packGrams ? Math.round(count * packGrams) / 1000 : count;
    return {
        text: `Saya siapkan catatan ${commodity.name.toLowerCase()} ${amount} ${unitKey} seharga ${rupiah(total)}. Cek dulu, lalu tekan Simpan.`,
        summary: { ingredient: commodity.name, amount, unit: unitKey, totalPrice: money(total), pricePerKg: money(total / (amount * BUY_UNITS[unitKey])), saved: false },
        card: { kind: CardKind.NotaDraft, commodityId: commodity.id, amount, unitKey, total: money(total) },
    };
};

const draftSellPrice = (ctx: ToolContext, args: Args): ToolResult => {
    const menu = pickMenu(ctx, args, "Harga menu yang mana?");
    if (isResult(menu)) return menu;
    const price = positive(args.price);
    if (!price) return { text: `Harga baru ${menu.name} berapa? Contoh: 21 ribu.`, ask: true };
    const { costNow, summary } = menuNumbers(ctx, menu);
    return {
        text: `Harga ${menu.name} mau diubah ke ${rupiah(price)}. Cek untungnya dulu, lalu tekan Simpan.`,
        summary: { ...summary, newSellPrice: money(price), profitAfter: fraction(marginOf(price, costNow)), saved: false },
        card: { kind: CardKind.PriceDraft, menuId: menu.id, price: money(price) },
    };
};

const draftNewMenu = (ctx: ToolContext, args: Args): ToolResult => {
    const name = label(args.name);
    if (!name) return { text: "Nama menunya apa?", ask: true };
    const twin = ctx.menus.find((menu) => menu.name.trim().toLowerCase() === name.toLowerCase());
    if (twin) return { text: `Menu ${twin.name} sudah ada. Mau mengubah menu itu?`, ask: true, choices: [{ label: `Ubah ${twin.name}`, text: `ubah menu ${twin.name.toLowerCase()}` }] };
    const recipe = typeof args.recipe === "string" ? args.recipe.trim() : "";
    const portions = positive(args.batch_portions);
    const batch = portions && portions > 1 ? Math.round(portions) : undefined;
    if (args.recipe_is_batch === true || batch) {
        const missing = [
            !/\d/.test(recipe) && "Sekali belanja, beli berapa banyak tiap bahannya? Contoh: 3 kg lele, 2 papan tempe.",
            !batch && "Belanjaan itu jadi berapa porsi?",
            !positive(args.sell_price) && "Seporsinya dijual berapa?",
        ].filter(Boolean);
        if (missing.length) return { text: missing.join(" "), ask: true };
    }
    if (!recipe) return { text: `Apa saja bahan ${name} untuk 1 porsi? Tulis jumlah, satuan, dan nama bahannya.`, ask: true };
    const suggested = !batch && (args.recipe_is_suggestion === true || !/\d/.test(ctx.text));
    const unknown = suggested ? unknownUnits(recipe) : [];
    if (unknown.length) return { text: `Unit ${[...new Set(unknown)].join(", ")} is not allowed. Write the recipe again using only: ${UNITS.join(", ")}.` };
    const parsed = parseRecipe(ctx, recipe);
    const draft: MenuDraft = { name, icon: Food.Dish, sellPrice: 0, ...NEW_MENU_DEFAULTS, ingredients: batch ? parsed.map((item) => perPortion(item, batch)) : parsed };
    draft.sellPrice = money(positive(args.sell_price) ?? suggestedPrice(ctx, draftCost(ctx, draft), draft.targetMargin));
    return {
        text: suggested
            ? `Ini saran bahan ${name} yang umum dipakai. Sesuaikan dengan resep Anda, lalu tekan Simpan.`
            : batch
              ? `Saya bagi belanjaan ${name} untuk ${batch} porsi. Cek takaran per porsinya, lalu tekan Simpan.`
              : `Saya siapkan menu ${name}. Cek bahannya dulu, lalu tekan Simpan.`,
        summary: { ...draftNumbers(ctx, draft), recipeIsSuggestion: suggested, ...(batch && { batchPortions: batch }) },
        card: { kind: CardKind.MenuDraft, menuId: null, menu: draft, recipe, ...(suggested && { suggested }), ...(batch && { batch }) },
    };
};

const unknownUnits = (recipe: string) =>
    recipe.split("\n").map((line) => line.trim().match(/^[\d.,/½¼¾]+\s*([a-zA-Z]+)\s/)?.[1]?.toLowerCase() ?? "").filter((word) => word && !UNIT_ALIASES[word]);

const sameIngredient = (a: DraftIngredient, b: DraftIngredient) =>
    (a.commodityId !== null && a.commodityId === b.commodityId) || a.name.toLowerCase() === b.name.toLowerCase();

const editable = (menu: MenuDraft) =>
    JSON.stringify([menu.name, menu.targetMargin, menu.extraCost, menu.ingredients.map(({ needsCheck, ...item }) => item)]);

const draftMenuChange = (ctx: ToolContext, args: Args): ToolResult => {
    const menu = pickMenu(ctx, args, "Menu yang mana yang mau diubah?");
    if (isResult(menu)) return menu;
    const current = { ...menu, ingredients: menu.ingredients.map(({ id, ...item }) => item) };
    const changed = typeof args.set_ingredients === "string" && args.set_ingredients.trim() ? parseRecipe(ctx, args.set_ingredients) : [];
    const removed = (Array.isArray(args.remove_ingredients) ? args.remove_ingredients : []).map(words).filter(Boolean);
    const all = Object.values(ctx.book.commodities);
    const isRemoved = (item: DraftIngredient) =>
        removed.some((word) => item.name.toLowerCase().includes(word) || (item.commodityId !== null && findCommodity(word, all)?.id === item.commodityId));
    const extraCost = Number(args.extra_cost);
    const profit = positive(args.target_profit_percent);
    const draft: MenuDraft = {
        name: label(args.new_name) || menu.name,
        icon: menu.icon,
        sellPrice: menu.sellPrice,
        targetMargin: profit && profit < 95 ? profit / 100 : menu.targetMargin,
        threshold: menu.threshold,
        extraCost: args.extra_cost !== undefined && Number.isFinite(extraCost) && extraCost >= 0 ? money(extraCost) : menu.extraCost,
        ingredients: [
            ...current.ingredients
                .filter((item) => !isRemoved(item))
                .map((item) => {
                    const next = changed.find((candidate) => sameIngredient(candidate, item));
                    return next ? { ...item, qty: next.qty, unit: next.unit } : item;
                }),
            ...changed.filter((candidate) => !current.ingredients.some((item) => sameIngredient(candidate, item))),
        ],
    };
    if (editable(draft) === editable(current)) {
        return { text: `Bagian mana dari ${menu.name} yang mau diubah? Bisa nama, bahan, biaya lain, atau target untung.`, ask: true };
    }
    const old = menuNumbers(ctx, menu).summary;
    return {
        text: `Saya siapkan perubahan ${menu.name}. Cek modal dan untungnya dulu, lalu tekan Simpan.`,
        summary: { ...draftNumbers(ctx, draft), costBefore: old.costNow, profitBefore: old.profitNow },
        card: { kind: CardKind.MenuDraft, menuId: menu.id, menu: draft },
    };
};

const draftMenuDelete = (ctx: ToolContext, args: Args): ToolResult => {
    const menu = pickMenu(ctx, args, "Menu yang mana yang mau dihapus?");
    if (isResult(menu)) return menu;
    return {
        text: `Menu ${menu.name} siap dihapus. Tekan Hapus kalau sudah yakin, menu yang terhapus tidak bisa dikembalikan.`,
        summary: { menu: menu.name, deleted: false },
        card: { kind: CardKind.MenuDelete, menuId: menu.id, name: menu.name },
    };
};

const RUNNERS: Record<ToolName, (ctx: ToolContext, args: Args) => ToolResult> = {
    [ToolName.MenuStatus]: menuStatus,
    [ToolName.PriceOptions]: priceOptions,
    [ToolName.IngredientPrice]: ingredientPrice,
    [ToolName.RiskyMenus]: riskyMenus,
    [ToolName.CateringQuote]: cateringQuote,
    [ToolName.DraftNota]: draftNota,
    [ToolName.DraftSellPrice]: draftSellPrice,
    [ToolName.DraftNewMenu]: draftNewMenu,
    [ToolName.DraftMenuChange]: draftMenuChange,
    [ToolName.DraftMenuDelete]: draftMenuDelete,
};

export const runTool = (ctx: ToolContext, name: string, rawArgs: string): ToolResult => {
    const runner = RUNNERS[name as ToolName];
    if (!runner) return { text: "", summary: { error: `Unknown tool ${name}` } };
    let args: Args = {};
    try {
        args = JSON.parse(rawArgs || "{}");
    } catch {
        args = {};
    }
    return runner(ctx, args);
};

const tool = (name: ToolName, description: string, properties: Record<string, unknown> = {}): ToolDefinition => ({
    type: "function",
    function: { name, description, parameters: { type: "object", properties } },
});

const MENU_ARG = { menu: { type: "string", description: "Menu name as the owner wrote it, e.g. geprek" } };
const INGREDIENT_ARG = { ingredient: { type: "string", description: "Ingredient name as the owner wrote it, e.g. cabe rawit" } };

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    tool(ToolName.MenuStatus, "Current profit and cost of one menu, and which ingredients made the cost rise. Use for 'kenapa untung X turun', 'untung X berapa'.", MENU_ARG),
    tool(ToolName.PriceOptions, "Options to fix a menu's profit: raise price, cut portion, swap ingredient. Use for 'X harus naik berapa', 'gimana solusinya'.", MENU_ARG),
    tool(ToolName.IngredientPrice, "Current price of one ingredient with its source and 7 day trend.", INGREDIENT_ARG),
    tool(ToolName.RiskyMenus, "Menus closest to losing money. Use for 'menu apa yang paling bahaya'."),
    tool(ToolName.CateringQuote, "Price quote for a catering order with a buffer for price rises before the event.", {
        ...MENU_ARG,
        portions: { type: "number", description: "Number of portions ordered" },
        days_ahead: { type: "number", description: "Days from today until the event" },
        target_profit_percent: { type: "number", description: "Wanted profit in percent, e.g. 30. Omit if not said" },
    }),
    tool(ToolName.DraftNota, "Prepare purchase notes for the owner to confirm. Does not save. Put every bought item in one call.", {
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    ...INGREDIENT_ARG,
                    amount: { type: "number", description: "Amount bought, e.g. 2" },
                    unit: { type: "string", enum: [...Object.keys(BUY_UNITS), PACK_UNIT], description: `Use ${PACK_UNIT} for pieces or packs, e.g. 12 bungkus mie instan = amount 12 unit ${PACK_UNIT}` },
                    total_price: { type: "number", description: "Total paid in rupiah, e.g. 150000 for '150 ribu'" },
                },
            },
        },
    }),
    tool(ToolName.DraftSellPrice, "Prepare a new selling price for a menu for the owner to confirm. Does not save.", {
        ...MENU_ARG,
        price: { type: "number", description: "New selling price in rupiah, e.g. 21000 for '21 ribu'" },
    }),
    tool(ToolName.DraftNewMenu, "Prepare a new menu from its recipe for the owner to confirm. Does not save. Use for 'tambah menu', 'bikin menu baru'.", {
        name: { type: "string", description: "Menu name, e.g. Ayam Geprek Keju" },
        recipe: { type: "string", description: `Ingredients for 1 portion, one per line as amount unit name, e.g. '150 gram ayam\n2 siung bawang putih'. If the owner only gave the name, write the usual ingredients of that dish in Indonesia yourself, using only these units: ${UNITS.join(", ")}. Rice, meat, fish, vegetables and spices by weight in gram (raw beras, e.g. '80 gram beras'), never 'porsi'` },
        recipe_is_suggestion: { type: "boolean", description: "true when the recipe was written by you, not by the owner" },
        recipe_is_batch: { type: "boolean", description: "true when the owner talks about what they buy for a whole batch (market trip, one day) or does not know the amount per portion. The tool then asks for the amounts, portions and selling price that are missing" },
        batch_portions: { type: "number", description: "When the owner gave what they buy for a whole batch (e.g. one market trip or one day) instead of 1 portion: how many portions that batch makes. The recipe is then the batch amounts as the owner said them; the app divides" },
        sell_price: { type: "number", description: "Selling price in rupiah if the owner said it. Omit to use the suggested price" },
    }),
    tool(ToolName.DraftMenuChange, "Prepare changes to a menu's name, ingredients, other cost or target profit for the owner to confirm. Does not save. For the selling price use draft_sell_price.", {
        ...MENU_ARG,
        new_name: { type: "string", description: "New menu name. Omit if unchanged" },
        set_ingredients: { type: "string", description: "Ingredients to add or whose amount changes, one per line as amount unit name for 1 portion" },
        remove_ingredients: { type: "array", items: { type: "string" }, description: "Ingredient names to remove" },
        extra_cost: { type: "number", description: "Other cost per portion like gas and packaging, in rupiah" },
        target_profit_percent: { type: "number", description: "Wanted profit in percent, e.g. 30" },
    }),
    tool(ToolName.DraftMenuDelete, "Prepare deleting a menu for the owner to confirm. Does not delete.", MENU_ARG),
];
