<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ChatBubble from "@/components/ChatBubble.vue";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { loadSession, loadSessions, type ChatMessage, type ChatSession } from "@/lib/assistant";
import { dateTime } from "@/lib/format";
import { useStore } from "@/lib/store";

const props = defineProps<{ id?: string }>();
const router = useRouter();
const { report } = useStore();

const loading = ref(true);
const sessions = ref<ChatSession[]>([]);
const messages = ref<ChatMessage[]>([]);

const session = computed(() => sessions.value.find((item) => item.id === props.id));

watch(
  () => props.id,
  async (id) => {
    loading.value = true;
    try {
      if (!sessions.value.length) sessions.value = await loadSessions();
      messages.value = id ? await loadSession(id) : [];
    } catch (error) {
      report(error);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <template v-if="id">
      <PageHead
        :title="session?.title ?? 'Percakapan'"
        :subtitle="session ? dateTime(new Date(session.startedAt)) : undefined"
        back="/tanya/riwayat"
      />
      <div v-if="loading" class="flex flex-col gap-4" aria-label="Memuat percakapan">
        <span class="skeleton ml-auto h-12 w-2/5 rounded-[22px]" />
        <span class="skeleton h-20 w-3/4 rounded-[22px]" />
        <span class="skeleton ml-auto h-12 w-1/2 rounded-[22px]" />
      </div>
      <div v-else class="flex flex-col gap-4">
        <ChatBubble v-for="message in messages" :key="message.id" :message="message" />
      </div>
    </template>

    <template v-else>
      <PageHead title="Riwayat chat" subtitle="Percakapan dengan asisten" back="/tanya" />
      <div v-if="loading" class="list" aria-label="Memuat riwayat">
        <div v-for="row in 4" :key="row" class="list-row">
          <span class="skeleton size-10 rounded-full" />
          <div class="flex flex-1 flex-col gap-2">
            <span class="skeleton h-4 w-3/5" />
            <span class="skeleton h-3 w-2/5" />
          </div>
        </div>
      </div>
      <div v-else-if="!sessions.length" class="card flex flex-col items-center gap-3.5 px-5 py-8 text-center">
        <span class="avatar size-16 bg-brand-soft text-brand"><Icon name="chat" :size="30" /></span>
        <h2>Belum ada percakapan</h2>
        <p class="text-ink-2">Pertanyaan Anda ke asisten akan tersimpan di sini.</p>
      </div>
      <div v-else class="list">
        <button v-for="item in sessions" :key="item.id" class="list-row" @click="router.push(`/tanya/riwayat/${item.id}`)">
          <span class="avatar avatar-sm bg-mist"><Icon name="chat" :size="20" /></span>
          <div class="min-w-0 flex-1">
            <strong class="block truncate">{{ item.title ?? "Percakapan" }}</strong>
            <p class="text-tiny text-ink-2">{{ dateTime(new Date(item.lastAt)) }} · {{ item.questions }} pertanyaan</p>
          </div>
          <Icon name="next" :size="20" class="text-ink-2" />
        </button>
      </div>
    </template>
  </div>
</template>
