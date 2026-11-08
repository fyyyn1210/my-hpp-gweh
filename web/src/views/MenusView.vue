<script setup lang="ts">
import FoodIcon from "@/components/FoodIcon.vue";
import Tip from "@/components/Tip.vue";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { motion } from "motion-v";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useStore } from "@/lib/store";
import { erosion, hpp, marginSteps, menuMargin, statusOf } from "@/lib/engine";
import { Formula } from "@/lib/constants";
import { dayLabel, percent, points, rupiah } from "@/lib/format";
import { Status } from "@/lib/types";

type Sort = "risk" | "margin" | "name";

const router = useRouter();
const { ranking } = useStore();

const sort = ref<Sort>("risk");
const filter = ref<"all" | Status>("all");

const sorts: Array<{ key: Sort; label: string }> = [
  { key: "risk", label: "Paling rawan" },
  { key: "margin", label: "Untung terkecil" },
  { key: "name", label: "Nama A-Z" },
];

const filters: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "Semua" },
  { key: Status.Loss, label: "Rugi" },
  { key: Status.Warning, label: "Waspada" },
  { key: Status.Safe, label: "Aman" },
];

const items = computed(() => {
  const list = ranking.value.filter((item) => filter.value === "all" || statusOf(item.menu) === filter.value);
  if (sort.value === "margin") return [...list].sort((a, b) => menuMargin(a.menu) - menuMargin(b.menu));
  if (sort.value === "name") return [...list].sort((a, b) => a.menu.name.localeCompare(b.menu.name));
  return list;
});
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Menu saya" subtitle="Untung tiap menu, dihitung dari harga terbaru">
      <button class="btn btn-sm" @click="router.push('/menu/baru')"><Icon name="plus" :size="20" />Tambah</button>
    </PageHead>

    <div class="flex flex-col gap-1.5">
      <div class="chips" aria-label="Saring status">
        <button v-for="item in filters" :key="item.key" class="chip" :class="{ active: filter === item.key }" @click="filter = item.key">
          {{ item.label }}
        </button>
      </div>
      <label class="flex items-center gap-3 px-1 text-small">
        <span class="text-ink-2">Urutkan</span>
        <select v-model="sort" class="min-h-[46px] rounded-full border-[1.5px] border-line bg-white px-4 text-[15.5px] outline-none">
          <option v-for="item in sorts" :key="item.key" :value="item.key">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div v-if="!items.length" class="card text-center text-ink-2">Tidak ada menu di kelompok ini.</div>

    <div class="flex flex-col gap-3.5">
      <motion.div
        v-for="(item, index) in items"
        :key="item.menu.id"
        layout
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: index * 0.03 }"
      >
        <RouterLink :to="`/menu/${item.menu.id}`" class="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft transition-transform active:scale-[0.99]">
          <div class="flex items-center gap-3">
            <span class="avatar"><FoodIcon :name="item.menu.icon" /></span>
            <div class="min-w-0 flex-1">
              <h3>{{ item.menu.name }}</h3>
              <p class="num text-tiny text-ink-2">Jual {{ rupiah(item.menu.sellPrice) }} · modal {{ rupiah(hpp(item.menu)) }}</p>
            </div>
            <StatusBadge :status="statusOf(item.menu)" />
          </div>
          <div class="flex items-center justify-between rounded-field bg-mist px-3.5 py-2.5">
            <div>
              <p class="text-tiny text-ink-2">Untung sekarang</p>
              <p class="num text-[26px] leading-tight font-semibold"><Tip :kind="Formula.Margin" :calc="marginSteps(item.menu.sellPrice, hpp(item.menu))">{{ percent(menuMargin(item.menu), 0) }}</Tip></p>
            </div>
            <div class="text-right">
              <p class="text-tiny text-ink-2">Sejak {{ dayLabel(item.menu.priceSetDay) }}</p>
              <p class="num text-small" :class="erosion(item.menu) > 0.005 ? 'font-semibold text-danger' : 'text-ink-2'">
                <Tip v-if="erosion(item.menu) > 0.005" :kind="Formula.Erosion">turun {{ points(erosion(item.menu)) }}</Tip><template v-else>stabil</template>
              </p>
            </div>
          </div>
        </RouterLink>
      </motion.div>
    </div>
  </div>
</template>
