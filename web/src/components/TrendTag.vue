<script setup lang="ts">
import { Formula } from "@/lib/constants";
import Tip from "./Tip.vue";
import { computed } from "vue";
import { signedPercent } from "@/lib/format";

const props = defineProps<{ value: number; invert?: boolean; label?: string }>();

const rising = computed(() => props.value > 0.001);
const falling = computed(() => props.value < -0.001);
const bad = computed(() => (props.invert ? falling.value : rising.value));
const cls = computed(() =>
  !rising.value && !falling.value ? "text-ink-2 font-medium" : bad.value ? "text-danger font-semibold" : "text-brand font-semibold",
);
const arrow = computed(() => (rising.value ? "↑" : falling.value ? "↓" : "•"));
</script>

<template>
  <span class="num whitespace-nowrap" :class="cls"><Tip :kind="Formula.PriceChange">{{ arrow }} {{ signedPercent(value) }}</Tip><span v-if="label" class="font-normal text-ink-2"> {{ label }}</span></span>
</template>
