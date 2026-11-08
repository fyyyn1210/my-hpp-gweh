<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import Logo from "@/components/Logo.vue";
import { normalizeEmail } from "@/lib/auth";
import { CITIES, PASSWORD_MIN } from "@/lib/constants";
import { useStore } from "@/lib/store";

const route = useRoute();
const router = useRouter();
const store = useStore();

const joining = computed(() => route.name === "register");

const name = ref("");
const email = ref("");
const password = ref("");
const city = ref(CITIES[0]);
const shareCommunity = ref(true);
const showPassword = ref(false);
const error = ref("");

const submit = () => {
  const normalized = normalizeEmail(email.value);
  if (joining.value && !name.value.trim()) return (error.value = "Isi nama panggilan Anda.");
  if (!normalized) return (error.value = "Email belum benar. Contoh: busari@gmail.com.");
  if (password.value.length < PASSWORD_MIN) return (error.value = `Kata sandi minimal ${PASSWORD_MIN} karakter.`);
  const failure = joining.value
    ? store.register({ email: normalized, name: name.value.trim(), city: city.value }, password.value)
    : store.login(normalized, password.value);
  if (failure) return (error.value = failure);
  if (joining.value) store.state.shareCommunity = shareCommunity.value;
  router.replace("/");
};

const demo = () => {
  store.loginDemo();
  router.replace("/");
};
</script>

<template>
  <section class="flex min-h-[calc(100vh-44px)] flex-col gap-6">
    <div class="flex items-center gap-3 text-[21px] font-semibold tracking-[-0.02em]"><Logo :size="44" />MyHPPGweh</div>

    <div class="flex flex-col gap-2">
      <h1>{{ joining ? "Buat akun" : "Masuk" }}</h1>
      <p class="text-ink-2">{{ joining ? "Gratis. Data menu dan harga Anda tersimpan di akun ini." : "Pakai email yang Anda daftarkan." }}</p>
    </div>

    <form class="card flex flex-col gap-4" novalidate @submit.prevent="submit" @input="error = ''">
      <div v-if="joining" class="flex flex-col gap-2">
        <label for="name" class="label">Nama panggilan</label>
        <input id="name" v-model="name" class="input" autocomplete="nickname" placeholder="Contoh: Bu Sari" />
      </div>
      <div class="flex flex-col gap-2">
        <label for="email" class="label">Email</label>
        <input id="email" v-model="email" class="input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="Contoh: busari@gmail.com" />
      </div>
      <div class="flex flex-col gap-2">
        <label for="password" class="label">Kata sandi</label>
        <div class="relative">
          <input
            id="password"
            v-model="password"
            class="input pr-[60px]"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="joining ? 'new-password' : 'current-password'"
            :placeholder="joining ? `Minimal ${PASSWORD_MIN} karakter` : ''"
          />
          <button
            type="button"
            class="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-2 hover:bg-white"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <Icon :name="showPassword ? 'eyeOff' : 'eye'" :size="22" />
          </button>
        </div>
      </div>
      <template v-if="joining">
        <div class="flex flex-col gap-2">
          <label for="city" class="label">Kota tempat usaha</label>
          <select id="city" v-model="city" class="input">
            <option v-for="item in CITIES" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
        <label class="flex cursor-pointer items-center gap-3 rounded-field bg-mist px-4 py-3.5">
          <span class="min-w-0 flex-1">
            <strong>Ikut berbagi harga nota</strong>
            <span class="block text-tiny text-ink-2">Tanpa nama warung. Bisa diubah nanti.</span>
          </span>
          <input v-model="shareCommunity" type="checkbox" class="toggle" />
        </label>
      </template>

      <p v-if="error" class="rounded-field bg-danger-soft px-4 py-3 text-small text-danger" role="alert">{{ error }}</p>

      <button type="submit" class="btn w-full">{{ joining ? "Daftar" : "Masuk" }}<Icon name="next" :size="20" /></button>
    </form>

    <p class="text-center text-ink-2">
      {{ joining ? "Sudah punya akun?" : "Belum punya akun?" }}
      <RouterLink :to="joining ? '/masuk' : '/daftar'" class="font-semibold text-ink underline underline-offset-4">{{ joining ? "Masuk" : "Daftar" }}</RouterLink>
    </p>

    <div v-if="!joining" class="mt-auto flex flex-col gap-2 pt-2">
      <button class="btn btn-white w-full" @click="demo"><Icon name="store" :size="20" />Coba akun demo</button>
      <p class="text-center text-tiny text-ink-2">Tanpa daftar. Memakai data contoh warung Bu Sari.</p>
    </div>
  </section>
</template>
