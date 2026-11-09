<script setup lang="ts">
import { computed } from "vue";
import { CardKind } from "@/lib/assistant";

const props = defineProps<{ kind: CardKind }>();

const LAYOUTS: Record<CardKind, { rows: number; chart?: boolean; button?: boolean }> = {
  [CardKind.Quote]: { rows: 3, button: true },
  [CardKind.Status]: { rows: 2, chart: true },
  [CardKind.Actions]: { rows: 3 },
  [CardKind.Price]: { rows: 1, chart: true, button: true },
  [CardKind.NotaDraft]: { rows: 1, button: true },
  [CardKind.PriceDraft]: { rows: 1, button: true },
  [CardKind.MenuDraft]: { rows: 3, button: true },
  [CardKind.MenuDelete]: { rows: 1, button: true },
  [CardKind.Ranking]: { rows: 3 },
};

const layout = computed(() => LAYOUTS[props.kind]);
</script>

<template>
  <div class="card flex flex-col gap-3" aria-hidden="true">
    <div class="flex items-center gap-3">
      <span class="skeleton size-10 rounded-full" />
      <div class="flex flex-1 flex-col gap-2">
        <span class="skeleton h-4 w-2/5" />
        <span class="skeleton h-3 w-1/4" />
      </div>
    </div>
    <span v-for="row in layout.rows" :key="row" class="skeleton h-11 w-full rounded-field" />
    <span v-if="layout.chart" class="skeleton h-24 w-full rounded-field" />
    <span v-if="layout.button" class="skeleton h-10 w-full rounded-full" />
  </div>
</template>
