<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";
import { Status } from "@/lib/types";

const props = defineProps<{ status: Status }>();

const view = computed(() => {
  if (props.status === Status.Safe) return { icon: "shield", text: "Aman", cls: "bg-brand-soft text-brand-deep" } as const;
  if (props.status === Status.Warning) return { icon: "alert", text: "Waspada", cls: "bg-warn-soft text-[#835600]" } as const;
  return { icon: "alert", text: "Rugi", cls: "bg-danger-soft text-danger" } as const;
});
</script>

<template>
  <span class="badge" :class="view.cls"><Icon :name="view.icon" :size="16" :stroke="2.2" />{{ view.text }}</span>
</template>
