<script setup lang="ts">
import FoodIcon from "@/components/FoodIcon.vue";
import { motion } from "motion-v";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";
import { AlarmKind, Status } from "@/lib/types";

const router = useRouter();
const { alarms, markAlarmRead, markAllRead, getMenu } = useStore();

const tab = ref<"all" | AlarmKind>("all");
const tabs: Array<{ key: "all" | AlarmKind; label: string }> = [
  { key: "all", label: "Semua" },
  { key: AlarmKind.MarginDrop, label: "Untung turun" },
  { key: AlarmKind.PriceSurge, label: "Harga naik" },
];

const items = computed(() => alarms.value.filter((alarm) => tab.value === "all" || alarm.kind === tab.value));
const isUnread = (id: string) => alarms.value.some((alarm) => alarm.id === id && !alarm.read);

const open = (id: string, menuId: string) => {
  markAlarmRead(id);
  router.push(`/menu/${menuId}`);
};
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Peringatan" subtitle="Kami kabari sebelum untung habis">
      <button class="btn btn-sm btn-white" @click="markAllRead"><Icon name="check" :size="18" />Dibaca</button>
    </PageHead>

    <div class="seg">
      <button v-for="item in tabs" :key="item.key" :class="{ active: tab === item.key }" @click="tab = item.key">{{ item.label }}</button>
    </div>

    <div v-if="!items.length" class="card flex flex-col items-center gap-3.5 px-5 py-8 text-center">
      <span class="avatar size-16 bg-brand-soft text-brand"><Icon name="shield" :size="30" /></span>
      <h2>Tidak ada peringatan</h2>
      <p class="text-ink-2">Semua menu Anda aman saat ini.</p>
    </div>

    <motion.article
      v-for="(alarm, index) in items"
      :key="alarm.id"
      layout
      class="card flex flex-col gap-3.5"
      :class="isUnread(alarm.id) && 'ring-2 ring-ink'"
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: index * 0.04 }"
    >
      <div class="flex items-center gap-3">
        <span class="avatar avatar-sm" :class="alarm.severity === Status.Loss ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'">
          <Icon :name="alarm.kind === AlarmKind.PriceSurge ? 'up' : 'alert'" :size="20" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-tiny text-ink-2">{{ alarm.kind === AlarmKind.PriceSurge ? "Harga bahan naik" : "Untung turun" }} · hari ini</p>
          <h3>{{ alarm.title }}</h3>
        </div>
        <span v-if="isUnread(alarm.id)" class="badge bg-ink text-white">Baru</span>
      </div>
      <p class="text-small">{{ alarm.detail }}</p>
      <div class="chips">
        <button
          v-for="menuId in alarm.menuIds.slice(0, 3)"
          :key="menuId"
          class="chip inline-flex items-center gap-1.5 bg-mist ring-0"
          @click="open(alarm.id, menuId)"
        >
          <FoodIcon v-if="getMenu(menuId)" :name="getMenu(menuId)!.icon" :size="18" />{{ alarm.menuIds.length === 1 ? "Lihat pilihan tindakan" : getMenu(menuId)?.name }}
          <Icon name="next" :size="18" />
        </button>
      </div>
    </motion.article>

    <div class="note">
      <Icon name="info" :size="20" class="mt-px flex-none" />
      <p>Peringatan juga dikirim ke Telegram bila sudah disambungkan di <RouterLink to="/pengaturan" class="font-semibold underline">Pengaturan</RouterLink>.</p>
    </div>
  </div>
</template>
