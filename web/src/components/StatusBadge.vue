<script setup lang="ts">
import { computed } from "vue";
import { Status } from "@/lib/types";

const props = defineProps<{ status: Status }>();

const view = computed(() => {
  if (props.status === Status.Safe) return { icon: "✅", text: "Aman", cls: "badge-safe" };
  if (props.status === Status.Warning) return { icon: "⚠️", text: "Waspada", cls: "badge-warning" };
  return { icon: "⛔", text: "Rugi", cls: "badge-loss" };
});
</script>

<template>
  <span class="badge" :class="view.cls">{{ view.icon }} {{ view.text }}</span>
</template>
