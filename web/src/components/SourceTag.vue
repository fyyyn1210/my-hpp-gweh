<script setup lang="ts">
import { computed } from "vue";
import { dayLabel } from "@/lib/format";
import { PriceSource } from "@/lib/types";

const props = defineProps<{ source: PriceSource; day?: number }>();

const view = computed(
  () =>
    ({
      [PriceSource.Nota]: { text: "Nota Anda", cls: "bg-brand-soft text-brand-deep" },
      [PriceSource.Community]: { text: "Komunitas", cls: "bg-info-soft text-info" },
      [PriceSource.Pihps]: { text: "PIHPS", cls: "bg-mist text-ink-2" },
      [PriceSource.Manual]: { text: "Harga tetap Anda", cls: "bg-warn-soft text-[#835600]" },
    })[props.source],
);
</script>

<template>
  <span class="badge px-[9px] py-[3px] text-[12.5px] font-medium" :class="view.cls">
    {{ view.text }}<template v-if="day !== undefined && source !== PriceSource.Manual"> · {{ dayLabel(day) }}</template>
  </span>
</template>
