<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{ values: number[]; height?: number; labels?: [string, string]; accent?: string; describe?: (from: number, to: number, value: number) => string }>(),
  {
    height: 132,
    accent: "#13945a",
  },
);

const root = ref<HTMLElement | null>(null);
const width = ref(330);
const observer = new ResizeObserver(([entry]) => (width.value = Math.max(1, entry.contentRect.width)));
onMounted(() => root.value && observer.observe(root.value));
onBeforeUnmount(() => observer.disconnect());

const gap = 11;
const columns = 30;

const buckets = computed(() => {
  const size = Math.max(1, Math.ceil(props.values.length / columns));
  const result: Array<{ from: number; to: number; value: number }> = [];
  for (let index = 0; index < props.values.length; index += size) {
    const slice = props.values.slice(index, index + size);
    result.push({ from: index, to: index + slice.length - 1, value: slice.reduce((sum, value) => sum + value, 0) / slice.length });
  }
  return result;
});

const selected = ref<number | null>(null);
watch(() => props.values, () => (selected.value = null));
const active = computed(() => selected.value ?? buckets.value.length - 1);
const detail = computed(() => {
  const bucket = buckets.value[active.value];
  return props.describe && bucket ? props.describe(bucket.from, bucket.to, bucket.value) : "";
});

const dots = computed(() => {
  const values = buckets.value.map((bucket) => bucket.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max === min ? 1 : max - min;
  const rows = Math.floor(props.height / gap);
  const step = width.value / buckets.value.length;
  return buckets.value.map((bucket, index) => {
    const filled = Math.round(((bucket.value - min) / span) * (rows - 4)) + 2;
    return {
      x: step * index + step / 2,
      step,
      ys: Array.from({ length: filled }, (_, row) => props.height - gap / 2 - row * gap),
      label: props.describe ? props.describe(bucket.from, bucket.to, bucket.value) : "",
    };
  });
});
</script>

<template>
  <div ref="root">
    <p v-if="describe" class="mb-1.5 text-small font-semibold" aria-live="polite">{{ detail }}</p>
    <svg :viewBox="`0 0 ${width} ${height}`" width="100%" :height="height" role="img" aria-label="Grafik tren">
      <g v-for="(column, index) in dots" :key="index">
        <line
          v-if="index === active"
          :x1="column.x"
          :x2="column.x"
          :y1="column.ys[column.ys.length - 1]"
          :y2="column.ys[0]"
          :stroke="accent"
          stroke-width="9"
          stroke-linecap="round"
          opacity="0.2"
        />
        <circle v-for="y in column.ys" :key="y" :cx="column.x" :cy="y" r="2.3" :fill="index === active ? accent : '#2b332e'" :opacity="index === active ? 1 : 0.5" />
        <circle v-if="index === active" :cx="column.x" :cy="column.ys[column.ys.length - 1] - 9" r="5.5" fill="#fff" :stroke="accent" stroke-width="3.5" />
        <rect
          v-if="describe"
          :x="column.x - column.step / 2"
          y="0"
          :width="column.step"
          :height="height"
          fill="transparent"
          class="cursor-pointer outline-none"
          role="button"
          tabindex="0"
          :aria-label="column.label"
          @click="selected = index"
          @keydown.enter.prevent="selected = index"
          @keydown.space.prevent="selected = index"
        />
      </g>
    </svg>
    <div v-if="labels" class="mt-1.5 flex justify-between text-tiny text-ink-2">
      <span>{{ labels[0] }}</span>
      <span>{{ labels[1] }}</span>
    </div>
  </div>
</template>
