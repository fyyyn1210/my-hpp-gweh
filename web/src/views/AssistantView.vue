<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AssistantCard from "@/components/AssistantCard.vue";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { chat, greeting, respond, suggestions, type Choice } from "@/lib/assistant";
import { EXPLAIN_DELAY_MS, SUGGEST_IDLE_MS, SUGGEST_MAX_WORDS } from "@/lib/constants";
import { uid } from "@/lib/format";

type Recognizer = { lang: string; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void };
type RecognizerClass = new () => Recognizer;

const route = useRoute();
const router = useRouter();

const input = ref("");
const thinking = ref(false);
const listening = ref(false);
const bottom = ref<HTMLElement | null>(null);

const menuId = route.query.menu ? String(route.query.menu) : undefined;
if (!chat.length || menuId) chat.push(greeting(menuId));

const scrollDown = () => nextTick(() => bottom.value?.scrollIntoView({ behavior: "smooth", block: "end" }));
scrollDown();

const idle = ref(false);
let idleTimer: ReturnType<typeof setTimeout> | undefined;
const waitIdle = () => {
  idle.value = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => (idle.value = true), SUGGEST_IDLE_MS);
};
waitIdle();
onBeforeUnmount(() => clearTimeout(idleTimer));

const hints = computed(() => suggestions(menuId));
const showHints = computed(
  () => idle.value && !thinking.value && !listening.value && input.value.trim().split(/\s+/).filter(Boolean).length <= SUGGEST_MAX_WORDS,
);

const send = (text: string, label = text) => {
  const clean = text.trim();
  if (!clean || thinking.value) return;
  chat.push({ id: uid("msg"), mine: true, text: label });
  input.value = "";
  thinking.value = true;
  idle.value = false;
  scrollDown();
  setTimeout(() => {
    chat.push(respond(clean));
    thinking.value = false;
    scrollDown();
    waitIdle();
  }, EXPLAIN_DELAY_MS);
};

const choose = (choice: Choice) => (choice.to ? router.push(choice.to) : send(choice.text ?? choice.label, choice.label));

const speech = window as unknown as { SpeechRecognition?: RecognizerClass; webkitSpeechRecognition?: RecognizerClass };
const Recognition = speech.SpeechRecognition ?? speech.webkitSpeechRecognition;

const listen = () => {
  if (!Recognition || listening.value) return;
  const recognizer = new Recognition();
  recognizer.lang = "id-ID";
  recognizer.onresult = (event) => send(event.results[0][0].transcript);
  recognizer.onend = () => (listening.value = false);
  listening.value = true;
  recognizer.start();
};
</script>

<template>
  <div class="flex min-h-[calc(100dvh-170px)] flex-col gap-4 lg:min-h-[calc(100dvh-110px)]">
    <PageHead title="Tanya" subtitle="Tanya soal untung, harga bahan, atau pesanan" />

    <div class="flex flex-1 flex-col gap-4">
      <motion.div
        v-for="message in chat"
        :key="message.id"
        class="flex flex-col gap-2.5"
        :class="message.mine ? 'items-end' : 'items-start'"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
      >
        <p
          class="max-w-[88%] rounded-[22px] px-4 py-3 text-[16px] leading-snug"
          :class="message.mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-white shadow-soft'"
        >
          {{ message.text }}
        </p>
        <div v-if="message.card" class="w-full">
          <AssistantCard :card="message.card" @send="send" />
        </div>
        <div v-if="message.choices?.length" class="flex w-full flex-col items-start gap-2">
          <button
            v-for="choice in message.choices"
            :key="choice.label"
            class="chip max-w-full bg-white py-2.5 text-left leading-snug whitespace-normal"
            @click="choose(choice)"
          >
            {{ choice.label }}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        <motion.p
          v-if="thinking"
          class="w-fit rounded-[22px] rounded-bl-md bg-white px-4 py-3 text-ink-2 shadow-soft"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
        >
          Sedang menghitung...
        </motion.p>
      </AnimatePresence>
      <div ref="bottom" />
    </div>

    <div class="sticky bottom-[96px] flex flex-col gap-2 lg:bottom-6">
      <AnimatePresence>
        <motion.div
          v-if="showHints"
          class="chips"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: 8 }"
          aria-label="Saran pertanyaan"
        >
          <button v-for="hint in hints" :key="hint.label" class="chip bg-white shadow-soft" @click="choose(hint)">{{ hint.label }}</button>
        </motion.div>
      </AnimatePresence>
      <form class="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lift" @submit.prevent="send(input)">
        <button
          v-if="Recognition"
          type="button"
          class="grid size-[52px] flex-none place-items-center rounded-full transition-colors"
          :class="listening ? 'bg-danger text-white' : 'bg-mist'"
          :aria-label="listening ? 'Sedang mendengar' : 'Bicara'"
          @click="listen"
        >
          <Icon name="mic" />
        </button>
        <input
          v-model="input"
          maxlength="400"
          class="min-h-[52px] min-w-0 flex-1 bg-transparent px-2 text-[17px] outline-none"
          :placeholder="listening ? 'Silakan bicara...' : 'Ketik pertanyaan...'"
          aria-label="Pertanyaan"
        />
        <button type="submit" class="grid size-[52px] flex-none place-items-center rounded-full bg-ink text-lime" :disabled="!input.trim() || thinking" aria-label="Kirim">
          <Icon name="send" />
        </button>
      </form>
    </div>
    <p class="-mt-2 text-center text-tiny text-ink-2">Angka dihitung sistem, bukan AI. Versi contoh: pemahaman kalimat masih sederhana.</p>
  </div>
</template>
