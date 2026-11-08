<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { motion } from "motion-v";
import Icon from "@/components/Icon.vue";
import Logo from "@/components/Logo.vue";
import SourceTag from "@/components/SourceTag.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import TrendTag from "@/components/TrendTag.vue";
import { useStore } from "@/lib/store";
import { commodityChange, menuMargin, priceInfo, statusOf } from "@/lib/engine";
import { TODAY, WEEK } from "@/lib/constants";
import { longDate, percent, points, thousands } from "@/lib/format";
import { AlarmKind, Status } from "@/lib/types";

const router = useRouter();
const { state, alarms, averageMargin, averageErosion, ranking, unreadCount, commodities } = useStore();

const today = longDate(new Date());

const counts = computed(() => ({
  warning: state.menus.filter((menu) => statusOf(menu) === Status.Warning).length,
  loss: state.menus.filter((menu) => statusOf(menu) === Status.Loss).length,
}));

const heroStatus = computed(() =>
  counts.value.loss ? Status.Loss : counts.value.warning ? Status.Warning : Status.Safe,
);

const headline = computed(() => {
  if (counts.value.loss) return `${counts.value.loss} menu sedang rugi`;
  if (counts.value.warning) return `${counts.value.warning} menu perlu naik harga`;
  return "Semua menu aman";
});

const usedIds = computed(() => new Set(state.menus.flatMap((menu) => menu.ingredients.map((item) => item.commodityId))));
const usedCommodities = computed(() =>
  commodities
    .filter((commodity) => usedIds.value.has(commodity.id))
    .map((commodity) => ({ commodity, info: priceInfo(commodity), change: commodityChange(commodity, TODAY - WEEK) }))
    .sort((a, b) => b.change - a.change),
);

const topAlarms = computed(() => alarms.value.slice(0, 3));
const topRisk = computed(() => ranking.value.slice(0, 3));

const actions = [
  { to: "/nota", icon: "receipt", label: "Catatan harga belanja" },
  { to: "/harga", icon: "chart", label: "Harga bahan" },
  { to: "/menu/baru", icon: "plus", label: "Tambah menu" },
] as const;

const openAlarm = (menuIds: string[]) => router.push(menuIds.length === 1 ? `/menu/${menuIds[0]}` : "/alarm");
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <header class="flex items-center gap-2.5">
      <Logo :size="48" class="lg:hidden" />
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl">Halo, {{ state.ownerName }}</h1>
        <p class="text-tiny text-ink-2">{{ today }}</p>
      </div>
      <RouterLink to="/alarm" class="icon-btn" aria-label="Peringatan">
        <Icon name="bell" />
        <b v-if="unreadCount" class="absolute -top-[3px] -right-[3px] grid h-5 min-w-5 place-items-center rounded-full bg-danger px-[5px] text-[11.5px] text-white ring-2 ring-white">{{ unreadCount }}</b>
      </RouterLink>
      <RouterLink to="/pengaturan" class="icon-btn" aria-label="Pengaturan"><Icon name="settings" /></RouterLink>
    </header>

    <section class="rounded-[36px] bg-white px-1.5 pt-1.5 pb-1 shadow-soft">
      <motion.div
        class="card-lime flex flex-col gap-2.5 px-[22px] pt-[22px] pb-6"
        :initial="{ scale: 0.97, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :transition="{ type: 'spring', stiffness: 260, damping: 24 }"
      >
        <div class="flex items-center justify-between gap-3">
          <p class="font-medium">Untung rata-rata per porsi</p>
          <StatusBadge :status="heroStatus" />
        </div>
        <div class="big-number mt-1.5 text-[72px]">{{ percent(averageMargin, 0) }}</div>
        <p class="text-[15.5px]">
          <span class="num font-semibold">{{ averageErosion > 0 ? "↓" : "↑" }} {{ points(Math.abs(averageErosion), 1) }}</span>
          sejak harga jual terakhir ditetapkan
        </p>
        <p class="mt-1 text-lg font-semibold">{{ headline }}</p>
      </motion.div>
      <div class="grid grid-cols-3 divide-x divide-line">
        <button
          v-for="(action, index) in actions"
          :key="action.to"
          class="group flex min-h-24 flex-col items-center gap-2 px-1.5 pt-4 pb-3.5 text-center text-[14.5px] leading-tight font-medium"
          @click="router.push(action.to)"
        >
          <span
            class="grid size-[46px] place-items-center rounded-full transition-transform group-active:scale-90"
            :class="index === 0 ? 'bg-ink text-lime' : 'bg-mist'"
          >
            <Icon :name="action.icon" />
          </span>
          {{ action.label }}
        </button>
      </div>
    </section>

    <section v-if="topAlarms.length" class="flex flex-col gap-3.5">
      <div class="section-head">
        <h2>Perlu tindakan</h2>
        <RouterLink to="/alarm">Semua <Icon name="next" :size="18" /></RouterLink>
      </div>
      <div class="list">
        <button v-for="alarm in topAlarms" :key="alarm.id" class="list-row active:bg-mist" @click="openAlarm(alarm.menuIds)">
          <span class="avatar avatar-sm" :class="alarm.severity === Status.Loss ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'">
            <Icon :name="alarm.kind === AlarmKind.PriceSurge ? 'up' : 'alert'" :size="20" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block">{{ alarm.title }}</strong>
            <span class="line-clamp-2 text-tiny text-ink-2">{{ alarm.detail }}</span>
          </span>
          <Icon name="next" class="text-ink-3" />
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-3.5">
      <div class="section-head">
        <h2>Harga bahan Anda</h2>
        <RouterLink to="/harga">Semua <Icon name="next" :size="18" /></RouterLink>
      </div>
      <div class="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-1 pb-4 [scrollbar-width:none] lg:mx-0 lg:px-0.5">
        <motion.div
          v-for="(item, index) in usedCommodities"
          :key="item.commodity.id"
          class="flex-none snap-start"
          :initial="{ opacity: 0, x: 24 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ delay: index * 0.04 }"
        >
          <RouterLink to="/harga" class="flex h-full w-[156px] flex-col items-start gap-[5px] rounded-card bg-white p-4 shadow-soft">
            <span class="avatar avatar-sm mb-1.5">{{ item.commodity.emoji }}</span>
            <span class="min-h-[34px] text-tiny leading-tight text-ink-2">{{ item.commodity.name }}</span>
            <strong class="num text-[22px]">{{ thousands(item.info.price) }}<span class="text-tiny font-normal text-ink-2">/{{ item.commodity.priceUnit }}</span></strong>
            <TrendTag :value="item.change" class="text-tiny" />
            <SourceTag :source="item.info.source" />
          </RouterLink>
        </motion.div>
        <RouterLink to="/nota" class="flex w-[156px] flex-none snap-start flex-col items-center justify-center gap-2.5 rounded-card bg-ink p-4 text-center font-medium text-white">
          <Icon name="plus" :size="28" />
          Catat harga baru
        </RouterLink>
      </div>
    </section>

    <section class="flex flex-col gap-3.5">
      <div class="section-head">
        <h2>Menu paling rawan</h2>
        <RouterLink to="/menu">Semua <Icon name="next" :size="18" /></RouterLink>
      </div>
      <div class="list">
        <RouterLink v-for="item in topRisk" :key="item.menu.id" :to="`/menu/${item.menu.id}`" class="list-row active:bg-mist">
          <span class="avatar">{{ item.menu.emoji }}</span>
          <span class="min-w-0 flex-1">
            <strong class="block">{{ item.menu.name }}</strong>
            <span class="text-small text-ink-2">Untung <b class="num text-ink">{{ percent(menuMargin(item.menu), 0) }}</b></span>
          </span>
          <StatusBadge :status="statusOf(item.menu)" />
        </RouterLink>
      </div>
    </section>

    <p class="text-center text-tiny text-ink-2">Semua harga di versi ini adalah data contoh, bukan harga pasar asli.</p>
  </div>
</template>
