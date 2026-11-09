<script setup lang="ts">
import { motion } from "motion-v";
import { computed, onBeforeUnmount, ref } from "vue";
import AssistantCard from "./AssistantCard.vue";
import type { ChatMessage, Choice } from "@/lib/assistant";
import { TYPING_CHARS_PER_TICK, TYPING_TICK_MS } from "@/lib/constants";

const props = defineProps<{ message: ChatMessage }>();
const emit = defineEmits<{ send: [text: string]; choose: [choice: Choice]; typed: [] }>();

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const shown = ref(props.message.animate && !reduced ? 0 : props.message.text.length);
const typing = computed(() => shown.value < props.message.text.length);
props.message.animate = false;

if (typing.value) {
  const timer = setInterval(() => {
    shown.value += TYPING_CHARS_PER_TICK;
    if (typing.value) return;
    clearInterval(timer);
    emit("typed");
  }, TYPING_TICK_MS);
  onBeforeUnmount(() => clearInterval(timer));
}
</script>

<template>
  <motion.div
    class="flex flex-col gap-2.5"
    :class="message.mine ? 'items-end' : 'items-start'"
    :initial="{ opacity: 0, y: 10 }"
    :animate="{ opacity: 1, y: 0 }"
  >
    <p
      v-if="message.text"
      class="max-w-[88%] rounded-[22px] px-4 py-3 text-[16px] leading-snug"
      :class="message.mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-white shadow-soft'"
      :aria-busy="typing"
    >
      {{ message.text.slice(0, shown) }}<span v-if="typing" class="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-ink" />
    </p>
    <div v-if="message.card" class="w-full">
      <AssistantCard :card="message.card" @send="emit('send', $event)" />
    </div>
    <div v-if="!typing && message.choices?.length" class="flex w-full flex-col items-start gap-2">
      <button
        v-for="choice in message.choices"
        :key="choice.label"
        class="chip max-w-full bg-white py-2.5 text-left leading-snug whitespace-normal"
        @click="emit('choose', choice)"
      >
        {{ choice.label }}
      </button>
    </div>
  </motion.div>
</template>
