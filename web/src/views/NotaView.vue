<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";
import { calibrationOf, communityStats, pihpsPrice } from "@/lib/engine";
import { BUY_UNITS } from "@/lib/constants";
import { dayLabel, percent, rupiah, thousands } from "@/lib/format";
import type { Commodity } from "@/lib/types";

const store = useStore();
const { state, commodities, commodityMap } = store;

const usedIds = computed(() => new Set(state.menus.flatMap((menu) => menu.ingredients.map((item) => item.commodityId))));
const options = computed(() => [...commodities].sort((a, b) => Number(usedIds.value.has(b.id)) - Number(usedIds.value.has(a.id))));

const selected = ref<Commodity | null>(null);
const amount = ref<number | null>(1);
const unitKey = ref(BUY_UNITS[0].key);
const total = ref<number | null>(null);
const shared = ref(state.shareCommunity);

const unit = computed(() => BUY_UNITS.find((item) => item.key === unitKey.value)!);
const pricePerKg = computed(() =>
  amount.value && total.value ? total.value / (amount.value * unit.value.perKg) : 0,
);
const community = computed(() => (selected.value ? communityStats(selected.value) : null));
const reference = computed(() =>
  selected.value ? (community.value?.median ?? pihpsPrice(selected.value)) : 0,
);
const diff = computed(() => (reference.value && pricePerKg.value ? pricePerKg.value / reference.value - 1 : 0));
const affected = computed(() =>
  selected.value ? state.menus.filter((menu) => menu.ingredients.some((item) => item.commodityId === selected.value!.id)).length : 0,
);

const pick = (commodity: Commodity) => {
  selected.value = commodity;
  unitKey.value = commodity.priceUnit === "liter" ? "liter" : "kg";
  amount.value = 1;
  total.value = null;
};

const save = () => {
  if (!selected.value || !pricePerKg.value) return;
  store.addNota({ commodityId: selected.value.id, pricePerKg: Math.round(pricePerKg.value), shared: shared.value && state.shareCommunity });
  selected.value = null;
};

const preset = commodityMap[String(useRoute().query.bahan ?? "")];
if (preset) pick(preset);

const history = computed(() => [...state.notas].sort((a, b) => b.day - a.day));
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Catatan harga belanja" subtitle="Salin dari nota. Cukup bahan yang harganya berubah." />

    <AnimatePresence mode="wait">
      <motion.section
        v-if="!selected"
        key="pick"
        class="flex flex-col gap-3.5"
        :initial="{ opacity: 0, x: -16 }"
        :animate="{ opacity: 1, x: 0 }"
        :exit="{ opacity: 0, x: -16 }"
      >
        <p class="label px-1">1. Pilih bahan yang dibeli</p>
        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <button
            v-for="commodity in options"
            :key="commodity.id"
            class="flex min-h-[132px] flex-col items-start gap-1.5 rounded-card bg-white p-4 text-left shadow-soft transition-transform active:scale-[0.97]"
            @click="pick(commodity)"
          >
            <span class="avatar">{{ commodity.emoji }}</span>
            <span class="mt-1 leading-tight font-semibold">{{ commodity.name }}</span>
            <span v-if="usedIds.has(commodity.id)" class="text-tiny text-ink-2">dipakai di menu</span>
          </button>
        </div>
      </motion.section>

      <motion.section
        v-else
        key="form"
        class="card flex flex-col gap-4"
        :initial="{ opacity: 0, x: 16 }"
        :animate="{ opacity: 1, x: 0 }"
        :exit="{ opacity: 0, x: 16 }"
      >
        <div class="flex items-center gap-3">
          <span class="avatar">{{ selected.emoji }}</span>
          <div class="min-w-0 flex-1">
            <h2>{{ selected.name }}</h2>
            <p class="text-tiny text-ink-2">Dipakai di {{ affected }} menu Anda</p>
          </div>
          <button class="icon-btn-flat" aria-label="Ganti bahan" @click="selected = null"><Icon name="close" /></button>
        </div>

        <div class="flex flex-col gap-2">
          <label for="amount" class="label">2. Beli berapa?</label>
          <div class="flex items-center gap-3">
            <input id="amount" v-model.number="amount" type="number" min="0" step="any" inputmode="decimal" class="input num w-24 flex-none px-2 text-center text-xl" />
            <div class="seg flex-1">
              <button v-for="item in BUY_UNITS" :key="item.key" :class="{ active: unitKey === item.key }" @click="unitKey = item.key">{{ item.label }}</button>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="total" class="label">3. Bayar berapa total?</label>
          <div class="input-money">
            <span>Rp</span>
            <input id="total" v-model.number="total" type="number" min="0" inputmode="numeric" placeholder="0" />
          </div>
        </div>

        <AnimatePresence>
          <motion.div
            v-if="pricePerKg"
            class="flex flex-col gap-1.5 rounded-field bg-lime p-[18px]"
            :initial="{ opacity: 0, scale: 0.96 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.96 }"
          >
            <p class="text-small text-ink-2">Harga per {{ selected.priceUnit }}</p>
            <p class="big-number"><span class="cur">Rp</span>{{ thousands(pricePerKg) }}</p>
            <p class="text-small">
              <template v-if="Math.abs(diff) < 0.02">Sama dengan</template>
              <template v-else-if="diff > 0"><b class="text-danger">{{ percent(diff, 0) }} lebih mahal</b> dari</template>
              <template v-else><b class="text-brand">{{ percent(-diff, 0) }} lebih murah</b> dari</template>
              {{ community ? `harga komunitas ${state.city}` : "harga PIHPS" }} ({{ rupiah(reference) }})
            </p>
          </motion.div>
        </AnimatePresence>

        <label v-if="state.shareCommunity" class="flex cursor-pointer items-center gap-3 rounded-field bg-mist px-4 py-3.5">
          <span class="min-w-0 flex-1">
            <strong>Bagikan ke komunitas {{ state.city }}</strong>
            <span class="block text-tiny text-ink-2">Tanpa nama warung. Membantu pedagang lain.</span>
          </span>
          <input v-model="shared" type="checkbox" class="toggle" />
        </label>

        <button class="btn w-full" :disabled="!pricePerKg" @click="save"><Icon name="check" :size="20" />Simpan harga</button>
      </motion.section>
    </AnimatePresence>

    <section class="flex flex-col gap-3.5">
      <div class="section-head"><h2>Catatan terakhir</h2></div>
      <div v-if="!history.length" class="card text-ink-2">Belum ada catatan.</div>
      <div v-else class="list">
        <motion.div v-for="nota in history" :key="nota.id" layout class="list-row">
          <span class="avatar avatar-sm">{{ commodityMap[nota.commodityId].emoji }}</span>
          <div class="min-w-0 flex-1">
            <strong>{{ commodityMap[nota.commodityId].name }}</strong>
            <p class="text-tiny text-ink-2">{{ dayLabel(nota.day) }}<template v-if="nota.shared"> · dibagikan</template></p>
          </div>
          <div class="text-right">
            <strong class="num">{{ rupiah(nota.pricePerKg) }}</strong>
            <p class="text-tiny text-ink-2">/{{ commodityMap[nota.commodityId].priceUnit }}</p>
          </div>
          <button class="icon-btn-flat" aria-label="Hapus catatan" @click="store.removeNota(nota.id)"><Icon name="trash" :size="19" /></button>
        </motion.div>
      </div>
      <div class="note">
        <Icon name="info" :size="20" class="mt-px flex-none" />
        <p>Harga nota dipakai 14 hari. Setelah itu kami perkirakan dari tren PIHPS, disesuaikan dengan selisih harga nota Anda selama ini<template v-if="selected"> (untuk {{ selected.name.toLowerCase() }}: {{ percent(calibrationOf(selected) - 1, 0) }})</template>.</p>
      </div>
    </section>
  </div>
</template>
