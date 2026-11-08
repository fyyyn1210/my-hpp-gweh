<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 40 });
</script>

<template>
  <img src="/logo.png" :width="size" :height="size" alt="MyHPPGweh" class="flex-none rounded-[28%]" />
</template>
