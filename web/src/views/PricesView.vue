<script setup lang="ts">
import { computed, ref } from "vue";
import PageHead from "@/components/PageHead.vue";
import Sparkline from "@/components/Sparkline.vue";
import TrendTag from "@/components/TrendTag.vue";
import { useStore } from "@/lib/store";
import { commodityChange, commodityPrice, commoditySeries } from "@/lib/engine";
import { TODAY, WEEK } from "@/lib/constants";
import { rupiah, shortDate } from "@/lib/format";
import type { Commodity } from "@/lib/types";

const { commodities, state } = useStore();

const search = ref("");
const selected = ref<Commodity | null>(null);
const range = ref(30);

const list = computed(() =>
  commodities
    .filter((item) => item.name.toLowerCase().includes(search.value.toLowerCase().trim()))
    .map((commodity) => ({
      commodity,
      price: commodityPrice(commodity),
      day: commodityChange(commodity, TODAY - 1),
      week: commodityChange(commodity, TODAY - WEEK),
    }))
    .sort((a, b) => b.week - a.week),
);

const usedBy = computed(() =>
  selected.value ? state.menus.filter((menu) => menu.ingredients.some((item) => item.commodityId === selected.value!.id)) : [],
);

const chartValues = computed(() =>
  selected.value ? commoditySeries(selected.value).slice(TODAY + 1 - range.value) : [],
);
const dateFor = (day: number) => shortDate(new Date(Date.now() - (TODAY - day) * 86_400_000));
const sourceDate = dateFor(TODAY);
</script>

<template>
  <div class="stack">
    <PageHead title="Harga Bahan" subtitle="Harga hari ini dan perubahannya" />

    <div class="field">
      <input v-model="search" class="input" placeholder="🔍 Cari bahan, misal: cabai" aria-label="Cari bahan" />
    </div>

    <div v-if="!list.length" class="card"><p class="muted">Bahan tidak ditemukan.</p></div>

    <button v-for="item in list" :key="item.commodity.id" class="list-item" @click="selected = item.commodity">
      <div class="avatar">{{ item.commodity.emoji }}</div>
      <div class="grow">
        <strong>{{ item.commodity.name }}</strong>
        <p class="small"><b>{{ rupiah(item.price) }}</b><span class="muted"> /{{ item.commodity.priceUnit }}</span></p>
      </div>
      <div class="right">
        <TrendTag :value="item.week" />
        <p class="tiny muted">seminggu</p>
      </div>
    </button>

    <p class="tiny muted">
      Sumber: contoh data bergaya PIHPS Bank Indonesia (harga pedagang besar), tanggal {{ sourceDate }}. Ini indikator tren, bukan harga beli pasti Anda.
    </p>

    <Transition name="fade">
      <div v-if="selected" class="overlay" @click.self="selected = null">
        <section class="sheet stack" role="dialog" :aria-label="selected.name">
          <div class="row between">
            <div class="row">
              <div class="avatar">{{ selected.emoji }}</div>
              <div>
                <h2>{{ selected.name }}</h2>
                <p class="small muted">per {{ selected.priceUnit }}</p>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" @click="selected = null">Tutup</button>
          </div>
          <div class="big-number">{{ rupiah(commodityPrice(selected)) }}</div>
          <div class="grid-2">
            <div class="tile">
              <p class="tiny muted">Kemarin</p>
              <TrendTag :value="commodityChange(selected, TODAY - 1)" />
            </div>
            <div class="tile">
              <p class="tiny muted">Minggu lalu</p>
              <TrendTag :value="commodityChange(selected, TODAY - WEEK)" />
            </div>
          </div>
          <div class="chips">
            <button class="chip" :class="{ active: range === 7 }" @click="range = 7">7 hari</button>
            <button class="chip" :class="{ active: range === 30 }" @click="range = 30">30 hari</button>
          </div>
          <Sparkline
            :values="chartValues"
            :labels="[dateFor(TODAY + 1 - range), 'Hari ini']"
            :color="commodityChange(selected, TODAY + 1 - range) > 0 ? '#d93025' : '#2f7d32'"
          />
          <div v-if="usedBy.length" class="stack">
            <h3>Dipakai di menu Anda</h3>
            <RouterLink v-for="menu in usedBy" :key="menu.id" :to="`/menu/${menu.id}`" class="row used">
              <span class="avatar sm">{{ menu.emoji }}</span>
              <strong class="grow">{{ menu.name }}</strong>
              <span>→</span>
            </RouterLink>
          </div>
          <p v-else class="small muted">Belum dipakai di menu mana pun.</p>
        </section>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.right {
  text-align: right;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 33, 61, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}
.sheet {
  background: #fff;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 28px 28px 0 0;
  padding: 20px;
}
.tile {
  background: var(--green-50);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 18px;
}
.sm {
  width: 42px;
  height: 42px;
  font-size: 22px;
}
.used {
  background: var(--green-50);
  border-radius: 16px;
  padding: 10px 12px;
}
@media (min-width: 900px) {
  .overlay {
    align-items: center;
  }
  .sheet {
    border-radius: 28px;
  }
}
</style>
