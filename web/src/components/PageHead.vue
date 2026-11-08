<script setup lang="ts">
defineProps<{ title: string; back?: string; subtitle?: string }>();
</script>

<template>
  <header class="page-head">
    <RouterLink v-if="back" :to="back" class="back" aria-label="Kembali">←</RouterLink>
    <div class="grow">
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="muted small">{{ subtitle }}</p>
    </div>
    <slot />
  </header>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.back {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #fff;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  box-shadow: var(--shadow);
  flex: none;
}
</style>
