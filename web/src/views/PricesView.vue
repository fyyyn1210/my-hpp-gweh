<script setup lang="ts">
import Tip from "@/components/Tip.vue";
import { AnimatePresence, motion } from "motion-v";
import { computed, ref } from "vue";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import SourceTag from "@/components/SourceTag.vue";
import Sparkline from "@/components/Sparkline.vue";
import TrendTag from "@/components/TrendTag.vue";
import { useStore } from "@/lib/store";
import { calibrationOf, commodityChange, communityStats, latestNota, pihpsPrice, priceInfo } from "@/lib/engine";
import { commoditySeries } from "@/data/commodities";
import { COMMUNITY_MIN, Formula, RANGE_CHOICES, TODAY, WEEK } from "@/lib/constants";
import { dayLabel, percent, rupiah, thousands } from "@/lib/format";
import { PriceSource, type Commodity } from "@/lib/types";

const { commodities, state } = useStore();

const search = ref("");
const selected = ref<Commodity | null>(null);
const range = ref(RANGE_CHOICES[1]);

const list = computed(() =>
  commodities
    .filter((item) => item.name.toLowerCase().includes(search.value.toLowerCase().trim()))
    .map((commodity) => ({ commodity, info: priceInfo(commodity), week: commodityChange(commodity, TODAY - WEEK) }))
    .sort((a, b) => b.week - a.week),
);

const detail = computed(() => {
  if (!selected.value) return null;
  const commodity = selected.value;
  const series = commoditySeries(commodity).slice(TODAY + 1 - range.value);
  return {
    info: priceInfo(commodity),
    nota: latestNota(commodity.id),
    community: communityStats(commodity),
    pihps: pihpsPrice(commodity),
    calibration: calibrationOf(commodity),
    usedBy: state.menus.filter((menu) => menu.ingredients.some((item) => item.commodityId === commodity.id)),
    series,
    change: series[series.length - 1] / series[0] - 1,
  };
});
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Harga bahan" :subtitle="`Harga yang dipakai untuk menghitung modal Anda · ${state.city}`" />

    <label class="flex min-h-14 items-center gap-2.5 rounded-full bg-white px-5 shadow-soft">
      <Icon name="search" class="text-ink-2" />
      <input v-model="search" placeholder="Cari bahan, misal: cabai" aria-label="Cari bahan" class="min-h-[52px] w-full bg-transparent text-[17px] outline-none" />
    </label>

    <div class="-mt-2 flex flex-wrap items-center gap-1.5 px-1">
      <span class="text-tiny text-ink-2">Urutan sumber harga:</span>
      <SourceTag :source="PriceSource.Nota" /><span class="text-tiny text-ink-2">lalu</span>
      <SourceTag :source="PriceSource.Community" /><span class="text-tiny text-ink-2">lalu</span>
      <SourceTag :source="PriceSource.Pihps" />
    </div>

    <div v-if="!list.length" class="card text-ink-2">Bahan tidak ditemukan.</div>

    <div v-else class="list">
      <button v-for="item in list" :key="item.commodity.id" class="list-row active:bg-mist" @click="selected = item.commodity">
        <span class="avatar">{{ item.commodity.emoji }}</span>
        <span class="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <strong>{{ item.commodity.name }}</strong>
          <SourceTag :source="item.info.source" :day="item.info.day" />
        </span>
        <span class="text-right">
          <strong class="num block text-[17px]">{{ rupiah(item.info.price) }}</strong>
          <TrendTag :value="item.week" class="text-tiny" /> <span class="text-tiny text-ink-2">7 hari</span>
        </span>
      </button>
    </div>

    <AnimatePresence>
      <motion.div
        v-if="selected && detail"
        class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 lg:items-center"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click.self="selected = null"
      >
        <motion.section
          class="flex max-h-[92vh] w-full max-w-[560px] flex-col gap-3.5 overflow-y-auto rounded-t-hero bg-white px-[18px] pt-5 pb-7 lg:rounded-hero"
          role="dialog"
          :aria-label="selected.name"
          data-lenis-prevent
          :initial="{ y: 60 }"
          :animate="{ y: 0 }"
          :exit="{ y: 60 }"
          :transition="{ type: 'spring', stiffness: 320, damping: 32 }"
        >
          <div class="flex items-center gap-3">
            <span class="avatar">{{ selected.emoji }}</span>
            <div class="min-w-0 flex-1">
              <h2>{{ selected.name }}</h2>
              <p class="text-tiny text-ink-2">per {{ selected.priceUnit }}</p>
            </div>
            <button class="icon-btn-flat" aria-label="Tutup" @click="selected = null"><Icon name="close" /></button>
          </div>

          <div class="card-lime flex flex-col items-start gap-1.5 px-5 py-[18px]">
            <p class="text-small">Harga yang dipakai sekarang</p>
            <p class="big-number"><span class="cur">Rp</span>{{ thousands(detail.info.price) }}</p>
            <SourceTag :source="detail.info.source" :day="detail.info.day" />
          </div>

          <div class="list bg-mist shadow-none [&>.list-row+.list-row]:border-[#e1e8e2]">
            <div class="list-row">
              <span class="avatar avatar-sm bg-brand-soft text-brand-deep"><Icon name="receipt" :size="20" /></span>
              <span class="min-w-0 flex-1">
                <strong>Nota Anda</strong>
                <span class="block text-tiny text-ink-2">{{ detail.nota ? `dicatat ${dayLabel(detail.nota.day)}` : "belum dicatat 14 hari terakhir" }}</span>
              </span>
              <strong class="num">{{ detail.nota ? rupiah(detail.nota.pricePerKg) : "-" }}</strong>
            </div>
            <div class="list-row">
              <span class="avatar avatar-sm bg-info-soft text-info"><Icon name="users" :size="20" /></span>
              <span class="min-w-0 flex-1">
                <strong>Komunitas {{ state.city }}</strong>
                <span class="block text-tiny text-ink-2">
                  <template v-if="detail.community">
                    nilai tengah dari {{ detail.community.count }} pedagang, 7 hari<template v-if="detail.community.dropped">, {{ detail.community.dropped }} harga aneh dibuang</template>
                  </template>
                  <template v-else>belum cukup data (minimal {{ COMMUNITY_MIN }} pedagang)</template>
                </span>
              </span>
              <strong class="num">{{ detail.community ? rupiah(detail.community.median) : "-" }}</strong>
            </div>
            <div class="list-row">
              <span class="avatar avatar-sm bg-white"><Icon name="chart" :size="20" /></span>
              <span class="min-w-0 flex-1">
                <strong>PIHPS (data pemerintah)</strong>
                <span class="block text-tiny text-ink-2">
                  rata-rata pasar kota<template v-if="Math.abs(detail.calibration - 1) > 0.005">, nota Anda biasanya <Tip :kind="Formula.Calibration">{{ percent(Math.abs(detail.calibration - 1), 0) }}</Tip> {{ detail.calibration > 1 ? "lebih mahal" : "lebih murah" }}</template>
                </span>
              </span>
              <strong class="num">{{ rupiah(detail.pihps) }}</strong>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <h3>Tren harga PIHPS</h3>
            <TrendTag :value="detail.change" />
          </div>
          <div class="seg">
            <button v-for="days in RANGE_CHOICES" :key="days" :class="{ active: range === days }" @click="range = days">{{ days }} hari</button>
          </div>
          <Sparkline :values="detail.series" :labels="[dayLabel(TODAY + 1 - range), 'Hari ini']" :accent="detail.change > 0 ? '#d63a33' : '#13945a'" />

          <div v-if="detail.usedBy.length" class="flex flex-col gap-1.5">
            <h3>Dipakai di menu Anda</h3>
            <div class="chips">
              <RouterLink v-for="menu in detail.usedBy" :key="menu.id" :to="`/menu/${menu.id}`" class="chip inline-flex items-center gap-1.5">{{ menu.emoji }} {{ menu.name }}</RouterLink>
            </div>
          </div>

          <RouterLink :to="`/nota?bahan=${selected.id}`" class="btn w-full"><Icon name="receipt" :size="20" />Catat harga dari nota</RouterLink>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
