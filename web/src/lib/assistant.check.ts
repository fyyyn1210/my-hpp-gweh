import { CATALOG } from "../../../server/src/drizzle/seeds/catalog";
import { dummyPihpsSeries } from "../../../server/src/modules/commodities/pihps.dummy";
import { setCommodities } from "@/data/commodities";
import { CardKind, amountOf, daysOf, moneyOf, portionsOf, respond } from "./assistant";
import { Food, TODAY } from "./constants";
import { state } from "./state";
import { PriceSource, Unit, type Menu } from "./types";

setCommodities(CATALOG.map(({ basePrice, trend, volatility, seed, unitOverrides, ...item }) => ({ ...item, source: PriceSource.Pihps, unitOverrides: unitOverrides ?? {}, prices: dummyPihpsSeries({ basePrice, trend, volatility, seed, ...item }) })));
const fixture = (name: string, icon: Food, sellPrice: number, ingredients: Array<[string, number, Unit, string]>): Menu => ({
  id: `menu-${name.toLowerCase().replace(/\s+/g, "-")}`,
  name,
  icon,
  sellPrice,
  priceSetDay: TODAY - 30,
  targetMargin: 0.3,
  threshold: 0.2,
  extraCost: 1500,
  ingredients: ingredients.map(([itemName, qty, unit, commodityId], index) => ({
    id: `i${index}`,
    name: itemName,
    icon: Food.Ingredient,
    qty,
    unit,
    commodityId,
    manualPricePerKg: null,
  })),
});
state.menus = [
  fixture("Ayam Geprek", Food.Chicken, 19000, [["Daging ayam", 150, Unit.Gram, "ayam"], ["Cabai rawit", 40, Unit.Gram, "cabai-rawit"], ["Beras", 120, Unit.Gram, "beras"]]),
  fixture("Pecel Lele", Food.Fish, 18000, [["Cabai rawit", 30, Unit.Gram, "cabai-rawit"], ["Beras", 120, Unit.Gram, "beras"]]),
  fixture("Soto Ayam", Food.Dish, 17000, [["Daging ayam", 100, Unit.Gram, "ayam"], ["Beras", 100, Unit.Gram, "beras"]]),
];

const expect = (label: string, actual: unknown, wanted: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(wanted)}`);
};

expect("money ribu", moneyOf("beli rawit 2 kilo 150 ribu"), 150000);
expect("money rp", moneyOf("harga geprek jadi rp21.000"), 21000);
expect("money bare", moneyOf("jadi 21000"), 21000);
expect("money none", moneyOf("200 porsi 3 minggu"), null);
expect("amount", amountOf("beli rawit 2 kilo 150 ribu"), { amount: 2, unitKey: "kg" });
expect("amount half", amountOf("setengah kg"), { amount: 0.5, unitKey: "kg" });
expect("portions", portionsOf("pesanan 200 porsi"), 200);
expect("days week", daysOf("3 minggu lagi"), 21);
expect("days date", daysOf("tanggal 20", new Date(2026, 10, 8)), 12);

expect("quote", respond("Pesanan 200 porsi pecel lele 3 minggu lagi").card?.kind, CardKind.Quote);
expect("ask menu", respond("ada pesanan 100 porsi").card, undefined);
expect("fill menu", respond("pecel lele").card, undefined);
expect("fill days", respond("2 minggu").card?.kind, CardKind.Quote);
expect("ask portions", respond("pesanan soto ayam").card, undefined);
expect("bare portions", respond("150").card, undefined);
expect("fill all", respond("besok").card, { kind: CardKind.Quote, menuId: "menu-soto-ayam", portions: 150, daysAhead: 1, margin: 0.3 });
expect("portions bare", portionsOf("pesanan tanggal 20"), null);
expect("nota", respond("Tadi beli cabai rawit 2 kilo 150 ribu").card, { kind: CardKind.NotaDraft, commodityId: "cabai-rawit", amount: 2, unitKey: "kg", total: 150000 });
expect("price draft", respond("harga geprek jadi 21 ribu").card?.kind, CardKind.PriceDraft);
expect("new menu", respond("buatkan menu ayam geprek+nasi").choices?.[0]?.to, "/menu/baru");
expect("price draft bare", respond("harga geprek jadi 21000").card, { kind: CardKind.PriceDraft, menuId: "menu-ayam-geprek", price: 21000 });
expect("why", respond("kenapa untung geprek turun?").card?.kind, CardKind.Status);
expect("actions", respond("geprek harus naik berapa?").card?.kind, CardKind.Actions);
expect("price", respond("harga cabai rawit sekarang berapa?").card?.kind, CardKind.Price);
expect("ranking", respond("menu apa yang paling bahaya?").card?.kind, CardKind.Ranking);
expect("off topic", respond("siapa presiden amerika").card, undefined);

console.log("assistant ok");
