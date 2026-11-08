<script setup lang="ts">
import { motion } from "motion-v";
import { computed, ref } from "vue";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";
import { cateringQuote } from "@/lib/engine";
import { MARGIN_CHOICES, MS_PER_DAY, PORTION_CHOICES } from "@/lib/constants";
import { dateInput, longDate, percent, rupiah, thousands } from "@/lib/format";

const store = useStore();
const { state } = store;

const weeks = [1, 2, 3, 4];
const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
const inDays = (days: number) => dateInput(new Date(startOfToday.getTime() + days * MS_PER_DAY));

const menuId = ref(state.menus[0]?.id ?? "");
const portions = ref(PORTION_CHOICES[2]);
const eventDate = ref(inDays(21));
const margin = ref(0.3);

const menu = computed(() => store.getMenu(menuId.value));
const daysAhead = computed(() =>
  Math.max(1, Math.round((new Date(`${eventDate.value}T00:00:00`).getTime() - startOfToday.getTime()) / MS_PER_DAY)),
);
const quote = computed(() =>
  menu.value && portions.value > 0 ? cateringQuote(menu.value, portions.value, daysAhead.value, margin.value, state.roundingStep) : null,
);
const bufferPerPortion = computed(() => (quote.value ? quote.value.buffered.rounded - quote.value.plain.rounded : 0));
const riskLines = computed(() => (quote.value ? quote.value.lines.filter((line) => line.risk >= 1).slice(0, 3) : []));

const offerText = computed(() => {
  if (!quote.value || !menu.value) return "";
  return [
    `Penawaran ${menu.value.name}`,
    `Acara: ${longDate(new Date(`${eventDate.value}T00:00:00`))}`,
    `Jumlah: ${portions.value} porsi`,
    `Harga: ${rupiah(quote.value.buffered.rounded)} per porsi`,
    `Total: ${rupiah(quote.value.totalBuffered)}`,
    `Dari ${state.ownerName}`,
  ].join("\n");
});

const copy = async () => {
  try {
    await navigator.clipboard.writeText(offerText.value);
    store.showToast("Teks penawaran disalin");
  } catch {
    store.showToast("Gagal menyalin, salin manual");
  }
};
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Hitung pesanan katering" subtitle="Harga dikunci hari ini, bahan dibeli nanti. Kami tambahkan cadangan." back="/" />

    <section class="card flex flex-col gap-3.5">
      <p class="label">1. Menu apa yang dipesan?</p>
      <div class="chips">
        <button v-for="item in state.menus" :key="item.id" class="chip inline-flex items-center gap-2" :class="{ active: menuId === item.id }" @click="menuId = item.id">
          <span>{{ item.emoji }}</span>{{ item.name }}
        </button>
      </div>

      <p class="label">2. Berapa porsi?</p>
      <div class="flex items-center gap-3">
        <div class="chips min-w-0 flex-1">
          <button v-for="value in PORTION_CHOICES" :key="value" class="chip" :class="{ active: portions === value }" @click="portions = value">{{ value }}</button>
        </div>
        <input v-model.number="portions" type="number" min="1" inputmode="numeric" class="input num w-[92px] flex-none px-2 text-center" aria-label="Jumlah porsi" />
      </div>

      <p class="label">3. Kapan acaranya?</p>
      <div class="chips">
        <button v-for="week in weeks" :key="week" class="chip" :class="{ active: eventDate === inDays(week * 7) }" @click="eventDate = inDays(week * 7)">
          {{ week === 4 ? "1 bulan" : `${week} minggu` }} lagi
        </button>
      </div>
      <label class="flex min-h-14 items-center gap-3 rounded-field border-[1.5px] border-line bg-mist px-4">
        <Icon name="calendar" />
        <input v-model="eventDate" type="date" :min="inDays(1)" class="min-h-[52px] flex-1 bg-transparent text-[17px] outline-none" aria-label="Tanggal acara" />
        <span class="text-tiny text-ink-2">{{ daysAhead }} hari lagi</span>
      </label>

      <p class="label">4. Mau untung berapa?</p>
      <div class="chips">
        <button v-for="value in MARGIN_CHOICES" :key="value" class="chip" :class="{ active: margin === value }" @click="margin = value">{{ percent(value, 0) }}</button>
      </div>
    </section>

    <section v-if="quote && menu" class="rounded-[36px] bg-white p-1.5 shadow-soft">
      <div class="card-lime flex flex-col gap-2">
        <p class="text-small">Harga per porsi yang aman ditawarkan</p>
        <motion.p :key="quote.buffered.rounded" class="big-number my-1 text-[58px]" :initial="{ opacity: 0.3, y: 8 }" :animate="{ opacity: 1, y: 0 }">
          <span class="cur">Rp</span>{{ thousands(quote.buffered.rounded) }}
        </motion.p>
        <p class="text-small">Total {{ portions }} porsi: <b class="num">{{ rupiah(quote.totalBuffered) }}</b></p>
        <div class="mt-1.5 grid grid-cols-3 gap-2 rounded-field bg-white/70 px-3.5 py-3">
          <div>
            <p class="text-tiny">Tanpa cadangan</p>
            <p class="num font-semibold">{{ rupiah(quote.plain.rounded) }}</p>
          </div>
          <div>
            <p class="text-tiny">Cadangan</p>
            <p class="num font-semibold">+{{ rupiah(bufferPerPortion) }}</p>
          </div>
          <div>
            <p class="text-tiny">Perkiraan untung</p>
            <p class="num font-semibold">{{ rupiah(quote.profit) }}</p>
          </div>
        </div>
      </div>
      <div class="px-2.5 pt-2.5 pb-2">
        <button class="btn w-full" @click="copy"><Icon name="copy" :size="20" />Salin teks penawaran</button>
      </div>
    </section>

    <section v-if="quote" class="flex flex-col gap-3.5">
      <div class="section-head"><h2>Bahan paling berisiko naik</h2></div>
      <div v-if="riskLines.length" class="list">
        <div v-for="line in riskLines" :key="line.ingredient.id" class="list-row">
          <span class="avatar avatar-sm">{{ line.ingredient.emoji }}</span>
          <div class="min-w-0 flex-1">
            <strong>{{ line.ingredient.name }}</strong>
            <p class="text-tiny text-ink-2">Bisa naik sampai {{ percent(line.buffer, 0) }} dalam {{ daysAhead }} hari</p>
          </div>
          <span class="num font-semibold text-danger">+{{ rupiah(line.risk) }}</span>
        </div>
      </div>
      <p v-else class="card text-small text-ink-2">Bahan menu ini harganya stabil. Cadangan kecil saja.</p>
      <div class="note">
        <Icon name="info" :size="20" class="mt-px flex-none" />
        <p>Cadangan diambil dari riwayat harga: 9 dari 10 kali, kenaikan dalam {{ daysAhead }} hari tidak lebih dari angka di atas. Modal hari ini {{ rupiah(quote.base) }}, perkiraan saat acara {{ rupiah(quote.projected) }} per porsi.</p>
      </div>
    </section>
  </div>
</template>
