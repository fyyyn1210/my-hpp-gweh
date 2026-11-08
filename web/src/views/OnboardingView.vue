<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/lib/store";

const router = useRouter();
const { state } = useStore();

const slides = [
  {
    emoji: "📈",
    bg: "#fde4e1",
    title: "Harga bahan naik, Anda tahu duluan",
    text: "Kami pantau harga cabai, bawang, ayam, telur dan bahan lain setiap hari dari data pasar.",
  },
  {
    emoji: "🧮",
    bg: "#e8f7d4",
    title: "Modal tiap menu dihitung otomatis",
    text: "Masukkan resep Anda. Kami hitung modal per porsi dan untung Anda, tanpa kalkulator.",
  },
  {
    emoji: "🔔",
    bg: "#fff0d6",
    title: "Diberi tahu sebelum rugi",
    text: "Kalau untung menu menipis, kami kirim peringatan dan beri saran harga jual yang pas.",
  },
];

const index = ref(0);
const last = computed(() => index.value === slides.length - 1);

const next = () => {
  if (last.value) return finish();
  index.value += 1;
};

const finish = () => {
  state.onboardingDone = true;
  router.replace("/");
};
</script>

<template>
  <section class="onb" :style="{ background: slides[index].bg }">
    <div class="bars" aria-hidden="true">
      <span v-for="(_, i) in slides" :key="i" :class="{ on: i <= index }" />
    </div>
    <div class="art">{{ slides[index].emoji }}</div>
    <div class="stack">
      <h1>{{ slides[index].title }}</h1>
      <p class="lead">{{ slides[index].text }}</p>
    </div>
    <div class="stack">
      <button class="btn btn-block" @click="next">{{ last ? "Mulai pakai" : "Lanjut" }}</button>
      <button v-if="!last" class="btn btn-ghost btn-block" @click="finish">Lewati</button>
    </div>
  </section>
</template>

<style scoped>
.onb {
  min-height: calc(100vh - 48px);
  border-radius: 32px;
  padding: 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: space-between;
  transition: background 0.3s;
}
.bars {
  display: flex;
  gap: 8px;
}
.bars span {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.12);
}
.bars span.on {
  background: var(--ink);
}
.art {
  font-size: 120px;
  text-align: center;
}
h1 {
  font-size: 34px;
  line-height: 1.1;
}
.lead {
  font-size: 18px;
  color: #3b4a3b;
}
</style>
