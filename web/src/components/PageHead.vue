<script setup lang="ts">
import Icon from "./Icon.vue";

defineProps<{ title: string; back?: string; subtitle?: string }>();
</script>

<template>
  <header class="flex items-center gap-3.5 pt-1">
    <RouterLink v-if="back" :to="back" class="icon-btn" aria-label="Kembali"><Icon name="back" /></RouterLink>
    <div class="min-w-0 flex-1">
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="text-small text-ink-2">{{ subtitle }}</p>
    </div>
    <slot />
  </header>
</template>
