<script setup lang="ts">
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";

const store = useStore();
const { state } = store;

const tgName = "@HPPPintarBot";
</script>

<template>
  <div class="stack">
    <PageHead title="Pengaturan" subtitle="Atur cara kami memberi kabar" />

    <section class="card stack">
      <h2>Kirim peringatan lewat</h2>
      <label class="switch row between">
        <span>
          <strong>Di aplikasi ini</strong>
          <p class="tiny muted">Selalu tersimpan di halaman Peringatan.</p>
        </span>
        <input v-model="state.notifyInApp" type="checkbox" />
      </label>
      <label class="switch row between">
        <span>
          <strong>Telegram</strong>
          <p class="tiny muted">Pesan langsung ke HP Anda saat untung menipis.</p>
        </span>
        <input v-model="state.notifyTelegram" type="checkbox" />
      </label>
    </section>

    <section class="card stack">
      <h2>Sambungkan Telegram</h2>
      <template v-if="state.telegramLinked">
        <div class="help-box">✅ Telegram sudah tersambung. Peringatan akan dikirim ke {{ tgName }}.</div>
        <button class="btn btn-danger btn-block" @click="store.unlinkTelegram">Putuskan sambungan</button>
      </template>
      <template v-else-if="state.telegramCode">
        <ol class="steps">
          <li>Buka Telegram, cari <b>{{ tgName }}</b>.</li>
          <li>Tekan <b>Start</b>, lalu kirim pesan berikut:</li>
        </ol>
        <div class="code">/start {{ state.telegramCode }}</div>
        <button class="btn btn-green btn-block" @click="store.confirmTelegram">Sudah saya kirim</button>
        <p class="tiny muted">Versi contoh: tombol ini hanya mensimulasikan sambungan.</p>
      </template>
      <template v-else>
        <p class="small muted">Dapatkan kabar langsung di Telegram, tanpa harus membuka aplikasi ini.</p>
        <button class="btn btn-green btn-block" @click="store.linkTelegram">Buat kode sambungan</button>
      </template>
    </section>

    <section class="card stack">
      <h2>Tentang data</h2>
      <p class="small">Harga bahan memakai <b>contoh data</b> yang bergaya PIHPS Bank Indonesia. Setiap harga diberi label "harga pasar" atau "harga Anda".</p>
      <p class="small">Penjelasan dan saran pengganti nantinya dibantu AI. Semua hitungan uang dilakukan sistem biasa, bukan AI.</p>
      <p class="small">Resep Anda disimpan di perangkat ini saja pada versi contoh.</p>
    </section>

    <section class="card stack">
      <h2>Data contoh</h2>
      <button class="btn btn-ghost btn-block" @click="store.resetDemo">Kembalikan data contoh</button>
    </section>
  </div>
</template>

<style scoped>
.switch input {
  width: 28px;
  height: 28px;
  accent-color: var(--green-700);
  flex: none;
}
.steps {
  margin: 0;
  padding-left: 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.code {
  background: var(--ink);
  color: var(--yellow);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 22px;
  padding: 16px;
  border-radius: 16px;
  text-align: center;
  letter-spacing: 0.06em;
}
</style>
