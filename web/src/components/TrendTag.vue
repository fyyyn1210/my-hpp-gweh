<script setup lang="ts">
import { computed } from "vue";
import { signedPercent } from "@/lib/format";

const props = defineProps<{ value: number; invert?: boolean; label?: string }>();

const rising = computed(() => props.value > 0.001);
const falling = computed(() => props.value < -0.001);
const bad = computed(() => (props.invert ? falling.value : rising.value));
const cls = computed(() => (!rising.value && !falling.value ? "flat" : bad.value ? "up" : "down"));
const arrow = computed(() => (rising.value ? "▲" : falling.value ? "▼" : "●"));
</script>

<template>
  <span :class="cls">{{ arrow }} {{ signedPercent(value) }}<template v-if="label"> {{ label }}</template></span>
</template>
