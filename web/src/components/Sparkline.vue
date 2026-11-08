<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ values: number[]; height?: number; labels?: [string, string]; accent?: string }>(), {
  height: 132,
  accent: "#13945a",
});

const width = 330;
const gap = 11;
const columns = 30;

const buckets = computed(() => {
  const size = Math.max(1, Math.ceil(props.values.length / columns));
  const result: number[] = [];
  for (let index = 0; index < props.values.length; index += size) {
    const slice = props.values.slice(index, index + size);
    result.push(slice.reduce((sum, value) => sum + value, 0) / slice.length);
  }
  return result;
});

const dots = computed(() => {
  const min = Math.min(...buckets.value);
  const max = Math.max(...buckets.value);
  const span = max === min ? 1 : max - min;
  const rows = Math.floor(props.height / gap);
  const step = width / buckets.value.length;
  return buckets.value.map((value, index) => {
    const filled = Math.round(((value - min) / span) * (rows - 4)) + 2;
    return {
      x: step * index + step / 2,
      ys: Array.from({ length: filled }, (_, row) => props.height - gap / 2 - row * gap),
      last: index === buckets.value.length - 1,
    };
  });
});
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${width} ${height}`" width="100%" :height="height" role="img" aria-label="Grafik tren">
      <g v-for="(column, index) in dots" :key="index">
        <line
          v-if="column.last"
          :x1="column.x"
          :x2="column.x"
          :y1="column.ys[column.ys.length - 1]"
          :y2="column.ys[0]"
          :stroke="accent"
          stroke-width="9"
          stroke-linecap="round"
          opacity="0.2"
        />
        <circle v-for="y in column.ys" :key="y" :cx="column.x" :cy="y" r="2.3" :fill="column.last ? accent : '#2b332e'" :opacity="column.last ? 1 : 0.5" />
        <circle v-if="column.last" :cx="column.x" :cy="column.ys[column.ys.length - 1] - 9" r="5.5" fill="#fff" :stroke="accent" stroke-width="3.5" />
      </g>
    </svg>
    <div v-if="labels" class="mt-1.5 flex justify-between text-tiny text-ink-2">
      <span>{{ labels[0] }}</span>
      <span>{{ labels[1] }}</span>
    </div>
  </div>
</template>

