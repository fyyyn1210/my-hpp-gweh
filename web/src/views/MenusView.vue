<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import TrendTag from "@/components/TrendTag.vue";
import { useStore } from "@/lib/store";
import { hpp, hppChange, menuMargin, statusOf } from "@/lib/engine";
import { TODAY, WEEK } from "@/lib/constants";
import { percent, rupiah } from "@/lib/format";
import { RiskLevel, Status } from "@/lib/types";

type Sort = "risk" | "margin" | "name";

const router = useRouter();
const { ranking } = useStore();

const sort = ref<Sort>("risk");
const filter = ref<"all" | Status>("all");

const sorts: Array<{ key: Sort; label: string }> = [
  { key: "risk", label: "Paling rawan" },
  { key: "margin", label: "Untung terkecil" },
  { key: "name", label: "A-Z" },
];

const filters: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "Semua" },
  { key: Status.Loss, label: "⛔ Rugi" },
  { key: Status.Warning, label: "⚠️ Waspada" },
  { key: Status.Safe, label: "✅ Aman" },
];

const items = computed(() => {
  const list = ranking.value.filter((item) => filter.value === "all" || statusOf(item.menu) === filter.value);
  if (sort.value === "margin") return [...list].sort((a, b) => menuMargin(a.menu) - menuMargin(b.menu));
  if (sort.value === "name") return [...list].sort((a, b) => a.menu.name.localeCompare(b.menu.name));
  return list;
});

const riskText = (level: RiskLevel) =>
  level === RiskLevel.High ? "Rawan" : level === RiskLevel.Medium ? "Pantau" : "Aman";
const riskClass = (level: RiskLevel) =>
  level === RiskLevel.High ? "badge-loss" : level === RiskLevel.Medium ? "badge-warning" : "badge-safe";
</script>

<template>
  <div class="stack">
    <PageHead title="Menu Saya" subtitle="Urut dari yang paling rawan rugi">
      <button class="btn btn-green btn-sm" @click="router.push('/menu/baru')">+ Tambah</button>
    </PageHead>

    <div class="chips" role="tablist" aria-label="Filter status">
      <button v-for="item in filters" :key="item.key" class="chip" :class="{ active: filter === item.key }" @click="filter = item.key">
        {{ item.label }}
      </button>
    </div>
    <div class="row small">
      <span class="muted">Urutkan:</span>
      <select v-model="sort" class="select sort" aria-label="Urutkan menu">
        <option v-for="item in sorts" :key="item.key" :value="item.key">{{ item.label }}</option>
      </select>
    </div>

    <div v-if="!items.length" class="card center">
      <p class="muted">Tidak ada menu di kelompok ini.</p>
    </div>

    <button v-for="(item, index) in items" :key="item.menu.id" class="menu-card" @click="router.push(`/menu/${item.menu.id}`)">
      <div class="row">
        <span class="rank" v-if="sort === 'risk'">{{ index + 1 }}</span>
        <div class="avatar">{{ item.menu.emoji }}</div>
        <div class="grow left">
          <strong class="name">{{ item.menu.name }}</strong>
          <p class="small muted">Jual {{ rupiah(item.menu.sellPrice) }} · modal {{ rupiah(hpp(item.menu)) }}</p>
        </div>
        <StatusBadge :status="statusOf(item.menu)" />
      </div>
      <div class="row between stats">
        <div>
          <p class="tiny muted">Untung</p>
          <strong class="num">{{ percent(menuMargin(item.menu), 0) }}</strong>
        </div>
        <div>
          <p class="tiny muted">Modal seminggu</p>
          <TrendTag :value="hppChange(item.menu, TODAY - WEEK)" />
        </div>
        <div>
          <p class="tiny muted">Kerawanan</p>
          <span class="badge" :class="riskClass(item.vuln.level)">{{ riskText(item.vuln.level) }} {{ item.vuln.score }}</span>
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>
.menu-card {
  border: 0;
  background: #fff;
  border-radius: 22px;
  box-shadow: var(--shadow);
  padding: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}
.left {
  text-align: left;
}
.name {
  font-size: 18px;
}
.rank {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: var(--ink);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 14px;
  flex: none;
}
.stats {
  background: var(--green-50);
  border-radius: 16px;
  padding: 10px 14px;
  align-items: flex-start;
}
.num {
  font-size: 22px;
}
.sort {
  width: auto;
  min-height: 44px;
  font-size: 15px;
  font-weight: 700;
}
.center {
  text-align: center;
}
</style>
