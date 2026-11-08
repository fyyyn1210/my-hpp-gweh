<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ values: number[]; color?: string; height?: number; labels?: [string, string] }>(),
  { color: "#2f7d32", height: 120 },
);

const width = 320;
const pad = 8;

const bounds = computed(() => {
  const min = Math.min(...props.values);
  const max = Math.max(...props.values);
  return { min, max: max === min ? min + 1 : max };
});

const points = computed(() =>
  props.values.map((value, index) => {
    const x = pad + (index / Math.max(props.values.length - 1, 1)) * (width - pad * 2);
    const y = pad + (1 - (value - bounds.value.min) / (bounds.value.max - bounds.value.min)) * (props.height - pad * 2);
    return { x, y };
  }),
);

const line = computed(() => points.value.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "));
const area = computed(() => {
  const last = points.value[points.value.length - 1];
  const first = points.value[0];
  return `${first.x},${props.height} ${line.value} ${last.x},${props.height}`;
});
const last = computed(() => points.value[points.value.length - 1]);
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${width} ${height}`" width="100%" :height="height" role="img" aria-label="Grafik tren harga">
      <polygon :points="area" :fill="color" opacity="0.12" />
      <polyline :points="line" fill="none" :stroke="color" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle :cx="last.x" :cy="last.y" r="6" :fill="color" stroke="#fff" stroke-width="3" />
    </svg>
    <div v-if="labels" class="row between tiny muted">
      <span>{{ labels[0] }}</span>
      <span>{{ labels[1] }}</span>
    </div>
  </div>
</template>
