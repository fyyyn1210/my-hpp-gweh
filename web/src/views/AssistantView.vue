<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import CardSkeleton from "@/components/CardSkeleton.vue";
import ChatBubble from "@/components/ChatBubble.vue";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { chat, greeting, loadHistory, reply, resetChat, suggestions, type Choice, type Step } from "@/lib/assistant";
import { ASSISTANT_FIRST_STEP, SUGGEST_IDLE_MS, SUGGEST_MAX_WORDS } from "@/lib/constants";
import { uid } from "@/lib/format";

type Recognizer = { lang: string; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void };
type RecognizerClass = new () => Recognizer;

const route = useRoute();
const router = useRouter();

const input = ref("");
const thinking = ref(false);
const listening = ref(false);
const historyLoading = ref(false);
const step = ref<Step>({ text: ASSISTANT_FIRST_STEP });
const bottom = ref<HTMLElement | null>(null);

const menuId = route.query.menu ? String(route.query.menu) : undefined;
const scrollDown = () => nextTick(() => bottom.value?.scrollIntoView({ behavior: "smooth", block: "end" }));

if (chat.length) {
  if (menuId) chat.push(greeting(menuId));
  scrollDown();
} else {
  historyLoading.value = true;
  loadHistory().then((messages) => {
    historyLoading.value = false;
    if (chat.length) return;
    chat.push(...messages);
    if (!messages.length || menuId) chat.push(greeting(menuId));
    scrollDown();
  });
}

const newChat = () => {
  if (!chat.some((message) => message.mine)) return;
  resetChat();
  chat.push(greeting(menuId));
};

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
  step.value = { text: ASSISTANT_FIRST_STEP };
  idle.value = false;
  scrollDown();
  reply(clean, (next) => {
    step.value = { ...step.value, ...next };
    scrollDown();
  }).then((messages) => {
    chat.push(...messages);
    thinking.value = false;
    scrollDown();
    waitIdle();
  });
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
    <PageHead title="Tanya" subtitle="Tanya soal untung, harga bahan, atau pesanan">
      <button class="btn btn-sm btn-white" @click="router.push('/tanya/riwayat')"><Icon name="calendar" :size="18" />Riwayat</button>
      <button class="btn btn-sm btn-white" :disabled="thinking" @click="newChat"><Icon name="plus" :size="18" />Baru</button>
    </PageHead>

    <div class="flex flex-1 flex-col gap-4">
      <ChatBubble v-for="message in chat" :key="message.id" :message="message" @send="send" @choose="choose" @typed="scrollDown" />

      <div v-if="historyLoading" class="flex flex-col gap-4" aria-label="Memuat percakapan">
        <span class="skeleton ml-auto h-12 w-2/5 rounded-[22px]" />
        <span class="skeleton h-20 w-3/4 rounded-[22px]" />
      </div>

      <AnimatePresence>
        <motion.div
          v-if="thinking"
          class="flex flex-col items-start gap-2.5"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          aria-live="polite"
        >
          <p class="flex items-center gap-2 text-small text-ink-2">
            <span class="size-2 animate-pulse rounded-full bg-brand" />{{ step.text }}
          </p>
          <div class="flex w-3/4 flex-col gap-2 rounded-[22px] rounded-bl-md bg-white px-4 py-3.5 shadow-soft" aria-hidden="true">
            <span class="skeleton h-3.5 w-full" />
            <span class="skeleton h-3.5 w-4/5" />
          </div>
          <CardSkeleton v-if="step.card" :kind="step.card" class="w-full" />
        </motion.div>
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
    <p class="-mt-2 text-center text-tiny text-ink-2">Angka dihitung sistem, bukan AI.</p>
  </div>
</template>
