<script setup lang="ts">
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  CubeIcon,
  Coffee01Icon,
  DrumstickIcon,
  EggIcon,
  FishIcon,
  MilkCoconutIcon,
  NoodlesIcon,
  NutIcon,
  OrganicFoodIcon,
  PepperIcon,
  RiceBowl01Icon,
  SaladIcon,
  ServingFoodIcon,
  SoupIcon,
  SteakIcon,
  StreetFoodIcon,
  TeaIcon,
  WheatIcon,
} from "@hugeicons/core-free-icons";
import { Food } from "@/lib/constants";

withDefaults(defineProps<{ name: Food; size?: number }>(), { size: 26 });

type IconData = typeof EggIcon;

const draw = (...paths: string[]) =>
  paths.map((d, key) => ["path", { d, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: String(key) }]) as unknown as IconData;

const bottle = draw("M10 2h4", "M10.5 2v3.5L8 9v10.5a2.5 2.5 0 0 0 2.5 2.5h3a2.5 2.5 0 0 0 2.5-2.5V9l-2.5-3.5V2", "M12 12.5s-1.8 2-1.8 3.3a1.8 1.8 0 0 0 3.6 0c0-1.3-1.8-3.3-1.8-3.3Z");

const ICONS: Record<Food, IconData> = {
  [Food.Chili]: PepperIcon,
  [Food.Pepper]: PepperIcon,
  [Food.Onion]: draw("M12 21c-4 0-7-2.7-7-6.5C5 10 9 8 12 5c3 3 7 5 7 9.5 0 3.8-3 6.5-7 6.5Z", "M12 5V2.5", "M12 21c-1.8-2-2.5-4.3-2.5-6.5S10.5 10 12 8", "M12 21c1.8-2 2.5-4.3 2.5-6.5S13.5 10 12 8"),
  [Food.Garlic]: draw("M12 3c-.5 2-2 3-4 4.5C5.5 9.5 4 12 4 15a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6c0-3-1.5-5.5-4-7.5-2-1.5-3.5-2.5-4-4.5Z", "M12 8.5c-1.5 2-2 4.3-2 6.5s.7 4.3 2 6", "M12 8.5c1.5 2 2 4.3 2 6.5s-.7 4.3-2 6"),
  [Food.Chicken]: DrumstickIcon,
  [Food.Egg]: EggIcon,
  [Food.Beef]: SteakIcon,
  [Food.Rice]: RiceBowl01Icon,
  [Food.Oil]: bottle,
  [Food.Sugar]: draw("M8 6V3.5h8V6", "M7 6h10l1 3v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9Z", "M6 12h12"),
  [Food.Flour]: WheatIcon,
  [Food.Fish]: FishIcon,
  [Food.Cucumber]: draw("M5.5 18.5a3.5 3.5 0 0 1 0-5l8-8a3.5 3.5 0 0 1 5 5l-8 8a3.5 3.5 0 0 1-5 0Z", "M9 14h.01M12 11h.01M15 8h.01"),
  [Food.Nut]: NutIcon,
  [Food.Noodles]: NoodlesIcon,
  [Food.Soup]: SoupIcon,
  [Food.Tofu]: CubeIcon,
  [Food.Salt]: draw("M8 9h8l1.5 11a1.8 1.8 0 0 1-1.8 2H8.3a1.8 1.8 0 0 1-1.8-2Z", "M8 9V7a4 4 0 0 1 8 0v2", "M10.5 5.5h.01M13.5 5.5h.01"),
  [Food.Sauce]: bottle,
  [Food.Tea]: TeaIcon,
  [Food.Coconut]: MilkCoconutIcon,
  [Food.Salad]: SaladIcon,
  [Food.Skewer]: StreetFoodIcon,
  [Food.Coffee]: Coffee01Icon,
  [Food.Dish]: ServingFoodIcon,
  [Food.Ingredient]: OrganicFoodIcon,
};
</script>

<template>
  <HugeiconsIcon :icon="ICONS[name] ?? ICONS[Food.Ingredient]" :size="size" color="currentColor" :stroke-width="1.6" aria-hidden="true" />
</template>
