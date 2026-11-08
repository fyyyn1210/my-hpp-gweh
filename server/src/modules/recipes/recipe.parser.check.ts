import { parseRecipeText } from "#src/modules/recipes/recipe.parser.js";
import { Unit } from "#src/utils/hpp.constant.js";

const assert = (ok: boolean, label: string) => {
    if (!ok) throw new Error(label);
};

const commodities = [
    { id: "ayam", name: "Daging ayam ras", icon: "chicken", aliases: ["daging ayam", "ayam"] },
    { id: "cabai-merah", name: "Cabai merah keriting", icon: "pepper", aliases: ["cabe kriting", "cabai merah"] },
];
const [chicken, chili, soy, odd] = parseRecipeText("150 gram daging ayam\n1/2 ons cabe kriting\n2 sdm kecap manis\nsejumput garam", commodities);

assert(chicken.commodityId === "ayam" && chicken.qty === 150 && chicken.unit === Unit.Gram && !chicken.needsCheck, "commodity line");
assert(chili.commodityId === "cabai-merah" && chili.qty === 0.5 && chili.unit === Unit.Ons, "fraction qty");
assert(soy.commodityId === null && soy.manualPricePerKg === 25000 && soy.unit === Unit.Sdm, "manual hint");
assert(odd.needsCheck && odd.unit === Unit.Sdm, "unparsed line needs check");

console.log("recipe parser ok");
