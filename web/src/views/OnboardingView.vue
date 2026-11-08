<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Icon, { type IconName } from "@/components/Icon.vue";
import Logo from "@/components/Logo.vue";
import { useStore } from "@/lib/store";
import { CITIES } from "@/lib/constants";

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
const total = slides.length + 1;
const onForm = computed(() => index.value === slides.length);

const next = () => {
  if (onForm.value) return finish();
  index.value += 1;
};

const finish = () => {
  state.onboardingDone = true;
  router.replace("/");
};
</script>

<template>
  <section class="flex min-h-[calc(100vh-44px)] flex-col gap-5.5">
    <div class="flex items-center justify-between">
      <Logo :size="48" />
      <button v-if="!onForm" class="btn btn-sm btn-white" @click="index = slides.length">Lewati</button>
    </div>
    <div class="flex gap-1.5" aria-hidden="true">
      <span v-for="i in total" :key="i" class="h-[5px] flex-1 rounded-full transition-colors" :class="i - 1 <= index ? 'bg-ink' : 'bg-ink/12'" />
    </div>

    <AnimatePresence mode="wait">
      <motion.div
        v-if="!onForm"
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

      <motion.div v-else key="form" class="card flex flex-1 flex-col gap-4" :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }">
        <h1>Kenalan dulu</h1>
        <div class="flex flex-col gap-2">
          <label for="name" class="label">Nama panggilan</label>
          <input id="name" v-model="state.ownerName" class="input" placeholder="Contoh: Bu Sari" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="city" class="label">Kota tempat usaha</label>
          <select id="city" v-model="state.city" class="input">
            <option v-for="city in CITIES" :key="city" :value="city">{{ city }}</option>
          </select>
        </div>
        <label class="flex cursor-pointer items-center gap-3 rounded-field bg-mist px-4 py-3.5">
          <span class="min-w-0 flex-1">
            <strong>Ikut berbagi harga nota</strong>
            <span class="block text-tiny text-ink-2">Tanpa nama warung. Bisa diubah nanti.</span>
          </span>
          <input v-model="state.shareCommunity" type="checkbox" class="toggle" />
        </label>
      </motion.div>
    </AnimatePresence>

    <button class="btn w-full" :disabled="onForm && !state.ownerName.trim()" @click="next">
      {{ onForm ? "Mulai pakai" : "Lanjut" }}<Icon name="next" :size="20" />
    </button>
  </section>
</template>
