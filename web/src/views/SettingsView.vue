<script setup lang="ts">
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";
import { CITIES, ROUNDING_STEPS } from "@/lib/constants";
import { thousands } from "@/lib/format";

const store = useStore();
const { state } = store;

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
        <p class="text-sm text-ink-2">Dipakai untuk harga komunitas dan harga PIHPS kota Anda.</p>
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
      <hr class="border-line" />
      <label class="flex min-h-14 cursor-pointer items-center gap-3">
        <span class="min-w-0 flex-1">
          <strong>Telegram</strong>
          <span class="block text-tiny text-ink-2">Pesan langsung ke HP saat untung turun.</span>
        </span>
        <input v-model="state.notifyTelegram" type="checkbox" class="toggle" />
      </label>
    </section>

    <section class="card flex flex-col gap-3.5">
      <div class="flex items-center gap-3">
        <span class="avatar avatar-sm bg-info-soft text-info"><Icon name="send" :size="20" /></span>
        <h2 class="flex-1">Sambungkan Telegram</h2>
      </div>
      <template v-if="state.telegramLinked">
        <div class="note bg-brand-soft text-brand-deep"><Icon name="check" :size="20" class="mt-px flex-none" /><p>Sudah tersambung ke {{ tgName }}.</p></div>
        <button class="btn btn-danger w-full" @click="store.unlinkTelegram">Putuskan sambungan</button>
      </template>
      <template v-else-if="state.telegramCode">
        <ol class="flex list-decimal flex-col gap-1.5 pl-[22px]">
          <li>Buka Telegram, cari <b>{{ tgName }}</b>.</li>
          <li>Tekan <b>Start</b>, lalu kirim pesan ini:</li>
        </ol>
        <div class="num rounded-field bg-ink p-[18px] text-center text-2xl font-semibold tracking-[0.04em] text-lime">/start {{ state.telegramCode }}</div>
        <button class="btn w-full" @click="store.confirmTelegram">Sudah saya kirim</button>
        <p class="text-tiny text-ink-2">Versi contoh: tombol ini hanya pura-pura menyambung.</p>
      </template>
      <template v-else>
        <p class="text-small text-ink-2">Dapat kabar di Telegram tanpa harus membuka aplikasi.</p>
        <button class="btn w-full" @click="store.linkTelegram">Buat kode sambungan</button>
      </template>
    </section>

    <section class="card flex flex-col gap-3.5">
      <h2>Tentang data</h2>
      <p class="text-small">Harga diambil berurutan: <b>nota Anda</b> (14 hari terakhir), lalu <b>harga komunitas</b> kota Anda, lalu <b>PIHPS</b> Bank Indonesia yang disesuaikan dengan nota Anda.</p>
      <p class="text-small">AI hanya membantu membaca resep dan menjelaskan. Semua hitungan uang dilakukan sistem, bukan AI.</p>
      <p class="text-small text-ink-2">Versi ini masih memakai data contoh dan menyimpan data di perangkat ini.</p>
      <button class="btn btn-outline w-full" @click="store.resetDemo"><Icon name="refresh" :size="20" />Kembalikan data contoh</button>
    </section>
  </div>
</template>
