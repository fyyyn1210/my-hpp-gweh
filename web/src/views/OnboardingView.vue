<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Icon, { type IconName } from "@/components/Icon.vue";
import Logo from "@/components/Logo.vue";
import { useStore } from "@/lib/store";

const router = useRouter();
const { state } = useStore();

const slides: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "receipt",
    title: "Catat harga dari nota belanja",
    text: "Cukup bahan yang harganya berubah. Sisanya kami isi dari harga komunitas dan data pasar.",
  },
  {
    icon: "chart",
    title: "Lihat untung tiap menu, per porsi",
    text: "Cabai naik Rp1.000/kg? Kami hitung pengaruhnya ke tiap porsi, bukan kira-kira.",
  },
  {
    icon: "bell",
    title: "Tahu kapan harga harus naik, dan berapa",
    text: "Saat untung turun di bawah batas Anda, kami beri tahu dan beri pilihan: naik harga, kurangi porsi, atau ganti bahan.",
  },
];

const index = ref(0);
const last = computed(() => index.value === slides.length - 1);

const next = () => {
  if (last.value) return finish("/daftar");
  index.value += 1;
};

const finish = (to: string) => {
  state.onboardingDone = true;
  router.replace(to);
};
</script>

<template>
  <section class="flex min-h-[calc(100vh-44px)] flex-col gap-5.5">
    <div class="flex items-center justify-between">
      <Logo :size="48" />
      <button v-if="!last" class="btn btn-sm btn-white" @click="index = slides.length - 1">Lewati</button>
    </div>
    <div class="flex gap-1.5" aria-hidden="true">
      <span v-for="i in slides.length" :key="i" class="h-[5px] flex-1 rounded-full transition-colors" :class="i - 1 <= index ? 'bg-ink' : 'bg-ink/12'" />
    </div>

    <AnimatePresence mode="wait">
      <motion.div
        :key="index"
        class="flex flex-1 flex-col justify-center gap-8"
        :initial="{ opacity: 0, x: 30 }"
        :animate="{ opacity: 1, x: 0 }"
        :exit="{ opacity: 0, x: -30 }"
      >
        <div class="card-lime grid aspect-[1.2] max-h-[300px] w-full place-items-center rounded-[40px]">
          <motion.div :initial="{ scale: 0.7, rotate: -8 }" :animate="{ scale: 1, rotate: 0 }" :transition="{ type: 'spring', stiffness: 220, damping: 14 }">
            <Icon :name="slides[index].icon" :size="84" :stroke="1.4" />
          </motion.div>
        </div>
        <div class="flex flex-col gap-3">
          <h1 class="text-[30px]">{{ slides[index].title }}</h1>
          <p class="text-lg text-ink-2">{{ slides[index].text }}</p>
        </div>
      </motion.div>
    </AnimatePresence>

    <div class="flex flex-col gap-3">
      <button class="btn w-full" @click="next">
        {{ last ? "Buat akun" : "Lanjut" }}<Icon name="next" :size="20" />
      </button>
      <p class="text-center text-ink-2">
        Sudah punya akun?
        <button class="font-semibold text-ink underline underline-offset-4" @click="finish('/masuk')">Masuk</button>
      </p>
    </div>
  </section>
</template>
