<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import StatusBadge from "@/components/StatusBadge.vue";
import TrendTag from "@/components/TrendTag.vue";
import { useStore } from "@/lib/store";
import { hpp, hppChange, menuMargin, statusOf, commodityPrice } from "@/lib/engine";
import { TODAY, WEEK } from "@/lib/constants";
import { longDate, percent, rupiah } from "@/lib/format";
import { Status } from "@/lib/types";

const router = useRouter();
const { state, alarms, averageMargin, ranking, risingCommodities, unreadCount } = useStore();

const today = longDate(new Date());

const counts = computed(() => ({
  safe: state.menus.filter((menu) => statusOf(menu) === Status.Safe).length,
  warning: state.menus.filter((menu) => statusOf(menu) === Status.Warning).length,
  loss: state.menus.filter((menu) => statusOf(menu) === Status.Loss).length,
}));

const avgStatus = computed(() => {
  if (averageMargin.value < 0) return Status.Loss;
  if (counts.value.loss + counts.value.warning > 0) return Status.Warning;
  return Status.Safe;
});

const headline = computed(() => {
  if (counts.value.loss > 0) return `${counts.value.loss} menu sedang rugi. Segera cek.`;
  if (counts.value.warning > 0) return `${counts.value.warning} menu untungnya menipis.`;
  return "Semua menu Anda aman hari ini.";
});

const avgCost = computed(() =>
  state.menus.length ? state.menus.reduce((sum, menu) => sum + hpp(menu), 0) / state.menus.length : 0,
);
const avgCostChange = computed(() => {
  if (!state.menus.length) return 0;
  const before = state.menus.reduce((sum, menu) => sum + hpp(menu, TODAY - WEEK), 0) / state.menus.length;
  return before === 0 ? 0 : (avgCost.value - before) / before;
});

const topAlarms = computed(() => alarms.value.slice(0, 2));
const topRisk = computed(() => ranking.value.slice(0, 3));
const topRising = computed(() => risingCommodities.value.slice(0, 4));
const open = (id: string) => router.push(`/menu/${id}`);
</script>

<template>
  <div class="stack">
    <div>
      <p class="muted small">{{ today }}</p>
      <h1>Halo, Bu Sari 👋</h1>
    </div>

    <section class="hero card">
      <div class="row between">
        <p class="small hero-label">Rata-rata untung semua menu</p>
        <StatusBadge :status="avgStatus" />
      </div>
      <div class="big-number">{{ percent(averageMargin, 0) }}</div>
      <p class="hero-sub">{{ headline }}</p>
      <div class="row hero-meta">
        <span class="small">Modal rata-rata {{ rupiah(avgCost) }}</span>
        <TrendTag :value="avgCostChange" label="seminggu" />
      </div>
    </section>

    <section class="actions">
      <button class="act" @click="router.push('/harga')">
        <span class="act-icon">📈</span>
        <span>Cek harga bahan</span>
      </button>
      <button class="act" @click="router.push('/menu/baru')">
        <span class="act-icon">🧮</span>
        <span>Hitung modal menu</span>
      </button>
      <button class="act" @click="router.push('/alarm')">
        <span class="act-icon">🔔</span>
        <span>Lihat peringatan</span>
        <b v-if="unreadCount" class="act-dot">{{ unreadCount }}</b>
      </button>
    </section>

    <section v-if="topAlarms.length" class="stack">
      <div class="row between">
        <h2>Perlu perhatian</h2>
        <RouterLink to="/alarm" class="small link">Lihat semua</RouterLink>
      </div>
      <button
        v-for="alarm in topAlarms"
        :key="alarm.id"
        class="list-item"
        @click="alarm.menuIds.length === 1 ? open(alarm.menuIds[0]) : router.push('/alarm')"
      >
        <div class="avatar">{{ alarm.severity === 'loss' ? '⛔' : '⚠️' }}</div>
        <div class="grow">
          <strong>{{ alarm.title }}</strong>
          <p class="small muted">{{ alarm.detail }}</p>
        </div>
      </button>
    </section>

    <section class="stack">
      <div class="row between">
        <h2>Menu paling rawan</h2>
        <RouterLink to="/menu" class="small link">Semua menu</RouterLink>
      </div>
      <p class="small muted">Menu yang untungnya paling mudah habis kalau harga bahan naik lagi.</p>
      <button v-for="item in topRisk" :key="item.menu.id" class="list-item" @click="open(item.menu.id)">
        <div class="avatar">{{ item.menu.emoji }}</div>
        <div class="grow">
          <strong>{{ item.menu.name }}</strong>
          <p class="small muted">Untung {{ percent(menuMargin(item.menu), 0) }} · modal {{ rupiah(hpp(item.menu)) }}</p>
          <TrendTag :value="hppChange(item.menu, TODAY - WEEK)" label="modal seminggu" />
        </div>
        <StatusBadge :status="statusOf(item.menu)" />
      </button>
    </section>

    <section class="stack">
      <div class="row between">
        <h2>Bahan yang naik hari ini</h2>
        <RouterLink to="/harga" class="small link">Semua harga</RouterLink>
      </div>
      <div class="grid-2">
        <div v-for="item in topRising" :key="item.commodity.id" class="card mini">
          <div class="mini-emoji">{{ item.commodity.emoji }}</div>
          <p class="small muted">{{ item.commodity.name }}</p>
          <strong>{{ rupiah(commodityPrice(item.commodity)) }}<span class="tiny muted">/{{ item.commodity.priceUnit }}</span></strong>
          <div><TrendTag :value="item.change" /></div>
        </div>
      </div>
    </section>

    <p class="tiny muted">
      Sumber harga: contoh data mirip PIHPS Bank Indonesia. Bukan harga asli, hanya untuk uji tampilan.
    </p>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(140deg, #fff 0%, #fff9c9 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 22px;
}
.hero-label {
  font-weight: 700;
  color: var(--muted);
}
.hero-sub {
  font-size: 18px;
  font-weight: 700;
}
.hero-meta {
  justify-content: space-between;
  flex-wrap: wrap;
  border-top: 2px dashed var(--line);
  padding-top: 10px;
}
.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.act {
  position: relative;
  border: 0;
  background: #fff;
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 16px 6px;
  min-height: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  font-size: 14.5px;
  text-align: center;
}
.act:first-child {
  background: var(--ink);
  color: #fff;
}
.act-icon {
  font-size: 30px;
}
.act-dot {
  position: absolute;
  top: 8px;
  right: 10px;
  background: var(--red);
  color: #fff;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 12px;
}
.link {
  color: var(--green-700);
  font-weight: 800;
}
.mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
}
.mini-emoji {
  font-size: 30px;
}
</style>
