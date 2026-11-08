<script setup lang="ts">
import { computed } from "vue";
import { RiskLevel } from "@/lib/types";

const props = defineProps<{ score: number; level: RiskLevel }>();

const color = computed(() =>
  props.level === RiskLevel.High ? "#d63a33" : props.level === RiskLevel.Medium ? "#e0a100" : "#13945a",
);
const label = computed(() =>
  props.level === RiskLevel.High ? "Rawan" : props.level === RiskLevel.Medium ? "Perlu dipantau" : "Aman",
);
const arc = computed(() => {
  const length = Math.PI * 54;
  return { length, dash: (props.score / 100) * length };
});
</script>

<template>
  <div class="text-center">
    <svg viewBox="0 0 140 80" width="100%" role="img" :aria-label="`Tingkat kerawanan ${score} dari 100`">
      <path d="M 16 70 A 54 54 0 0 1 124 70" fill="none" stroke="#eef2ee" stroke-width="14" stroke-linecap="round" />
      <path
        d="M 16 70 A 54 54 0 0 1 124 70"
        fill="none"
        :stroke="color"
        stroke-width="14"
        stroke-linecap="round"
        :stroke-dasharray="`${arc.dash} ${arc.length}`"
      />
      <text x="70" y="66" text-anchor="middle" font-size="28" font-weight="600" fill="#101511">{{ score }}</text>
    </svg>
    <div class="-mt-0.5 font-semibold" :style="{ color }">{{ label }}</div>
  </div>
</template>

