<script setup lang="ts">
import { computed } from "vue";
import { RiskLevel } from "@/lib/types";

const props = defineProps<{ score: number; level: RiskLevel }>();

const color = computed(() =>
  props.level === RiskLevel.High ? "#d93025" : props.level === RiskLevel.Medium ? "#f5b700" : "#2f7d32",
);
const label = computed(() =>
  props.level === RiskLevel.High ? "Rawan" : props.level === RiskLevel.Medium ? "Perlu dipantau" : "Aman",
);
const arc = computed(() => {
  const radius = 54;
  const length = Math.PI * radius;
  return { radius, length, dash: (props.score / 100) * length };
});
</script>

<template>
  <div class="gauge">
    <svg viewBox="0 0 140 80" width="100%" role="img" :aria-label="`Tingkat kerawanan ${score} dari 100`">
      <path d="M 16 70 A 54 54 0 0 1 124 70" fill="none" stroke="#e3f2dc" stroke-width="16" stroke-linecap="round" />
      <path
        d="M 16 70 A 54 54 0 0 1 124 70"
        fill="none"
        :stroke="color"
        stroke-width="16"
        stroke-linecap="round"
        :stroke-dasharray="`${arc.dash} ${arc.length}`"
      />
      <text x="70" y="66" text-anchor="middle" font-size="26" font-weight="800" fill="#14213d">{{ score }}</text>
    </svg>
    <div class="gauge-label" :style="{ color }">{{ label }}</div>
  </div>
</template>

<style scoped>
.gauge {
  text-align: center;
}
.gauge-label {
  font-weight: 800;
  margin-top: -4px;
}
</style>
