<script setup lang="ts">
import { useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";
import { CITIES, PRICE_ATTRIBUTION, PRICE_DISCLAIMER, ROUNDING_STEPS } from "@/lib/constants";
import { thousands } from "@/lib/format";

const router = useRouter();
const store = useStore();
const { state } = store;

const logout = () => {
  store.logout();
  router.replace("/masuk");
};

const tgName = "@HPPPintarBot";
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Pengaturan" back="/" />

    <section class="card flex flex-col gap-4">
      <h2>Usaha Anda</h2>
      <div class="flex flex-col gap-2">
        <label for="owner" class="label">Nama panggilan</label>
        <input id="owner" v-model="state.ownerName" class="input" />
      </div>
      <div class="flex flex-col gap-2">
        <label for="city" class="label">Kota</label>
        <select id="city" v-model="state.city" class="input">
          <option v-for="city in CITIES" :key="city" :value="city">{{ city }}</option>
        </select>
        <p class="text-sm text-ink-2">Dipakai untuk harga komunitas dan harga pasar provinsi Anda.</p>
      </div>
      <div class="flex flex-col gap-2">
        <span class="label">Bulatkan harga jual ke</span>
        <div class="seg">
          <button v-for="value in ROUNDING_STEPS" :key="value" :class="{ active: state.roundingStep === value }" @click="state.roundingStep = value">
            Rp {{ thousands(value) }}
          </button>
        </div>
      </div>
    </section>

    <section class="card flex flex-col gap-3.5">
      <h2>Harga komunitas</h2>
      <label class="flex min-h-14 cursor-pointer items-center gap-3">
        <span class="min-w-0 flex-1">
          <strong>Ikut berbagi harga nota</strong>
          <span class="block text-tiny text-ink-2">Harga nota Anda ikut dihitung untuk pedagang lain di {{ state.city }}. Nama warung tidak dibagikan.</span>
        </span>
        <input v-model="state.shareCommunity" type="checkbox" class="toggle" />
      </label>
      <div class="note">
        <Icon name="shield" :size="20" class="mt-px flex-none" />
        <p>Harga komunitas baru muncul bila minimal 3 pedagang berbeda mengisi. Harga yang terlalu jauh dari pasar dibuang otomatis.</p>
      </div>
    </section>

    <section class="card flex flex-col gap-3.5">
      <h2>Kirim peringatan lewat</h2>
      <label class="flex min-h-14 cursor-pointer items-center gap-3">
        <span class="min-w-0 flex-1">
          <strong>Di aplikasi ini</strong>
          <span class="block text-tiny text-ink-2">Selalu tersimpan di halaman Peringatan.</span>
        </span>
        <input v-model="state.notifyInApp" type="checkbox" class="toggle" />
      </label>
    </section>

    <section class="card flex flex-col gap-3.5">
      <h2>Tentang data</h2>
      <p class="text-small">Harga diambil berurutan: <b>nota Anda</b> (14 hari terakhir), lalu <b>harga komunitas</b> kota Anda, lalu harga pasar dari <b>PIHPS Bank Indonesia</b>, atau <b>SP2KP Kemendag</b> untuk bahan yang tidak ada di PIHPS, disesuaikan dengan nota Anda. Bahan tanpa data pasar resmi memakai <b>harga perkiraan</b>.</p>
      <p class="text-small">AI hanya membantu membaca resep dan menjelaskan. Semua hitungan uang dilakukan sistem, bukan AI.</p>
      <p class="text-small text-ink-2">{{ PRICE_DISCLAIMER }}</p>
      <p class="text-small text-ink-2">{{ PRICE_ATTRIBUTION }} Menu dan nota Anda tersimpan di akun.</p>
    </section>

    <section class="card flex flex-col gap-3.5">
      <h2>Akun</h2>
      <p class="text-small">Masuk dengan <b>{{ state.session }}</b></p>
      <button class="btn btn-outline w-full" @click="logout"><Icon name="logout" :size="20" />Keluar</button>
    </section>
  </div>
</template>
