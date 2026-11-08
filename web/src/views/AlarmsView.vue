<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import { useStore } from "@/lib/store";
import { AlarmKind, Status } from "@/lib/types";

const router = useRouter();
const { alarms, state, markAlarmRead, markAllRead } = useStore();

const tab = ref<"all" | AlarmKind>("all");
const tabs: Array<{ key: "all" | AlarmKind; label: string }> = [
  { key: "all", label: "Semua" },
  { key: AlarmKind.MarginDrop, label: "Untung menipis" },
  { key: AlarmKind.PriceSurge, label: "Harga naik" },
];

const items = computed(() => alarms.value.filter((alarm) => tab.value === "all" || alarm.kind === tab.value));
const isUnread = (id: string) => !state.readAlarms.includes(id);

const open = (id: string, menuIds: string[]) => {
  markAlarmRead(id);
  if (menuIds.length === 1) router.push(`/menu/${menuIds[0]}`);
};
</script>

<template>
  <div class="stack">
    <PageHead title="Peringatan" subtitle="Kami kabari sebelum Anda rugi">
      <button class="btn btn-ghost btn-sm" @click="markAllRead">Tandai dibaca</button>
    </PageHead>

    <div class="chips">
      <button v-for="item in tabs" :key="item.key" class="chip" :class="{ active: tab === item.key }" @click="tab = item.key">
        {{ item.label }}
      </button>
    </div>

    <div v-if="!items.length" class="card center stack">
      <div class="big">🎉</div>
      <h2>Tidak ada peringatan</h2>
      <p class="muted">Semua menu Anda aman saat ini.</p>
    </div>

    <article v-for="alarm in items" :key="alarm.id" class="alarm card stack" :class="[`s-${alarm.severity}`, { unread: isUnread(alarm.id) }]">
      <div class="row">
        <div class="avatar">{{ alarm.severity === Status.Loss ? "⛔" : "⚠️" }}</div>
        <div class="grow">
          <strong>{{ alarm.title }}</strong>
          <p class="tiny muted">{{ alarm.kind === AlarmKind.PriceSurge ? "Harga bahan naik" : "Untung menipis" }} · hari ini</p>
        </div>
        <span v-if="isUnread(alarm.id)" class="new">BARU</span>
      </div>
      <p class="small">{{ alarm.detail }}</p>
      <div class="row wrap">
        <button v-if="alarm.menuIds.length === 1" class="btn btn-green btn-sm" @click="open(alarm.id, alarm.menuIds)">Lihat menu & saran</button>
        <template v-else>
          <RouterLink
            v-for="menuId in alarm.menuIds.slice(0, 3)"
            :key="menuId"
            :to="`/menu/${menuId}`"
            class="btn btn-soft btn-sm"
            @click="markAlarmRead(alarm.id)"
          >
            {{ state.menus.find((menu) => menu.id === menuId)?.name }}
          </RouterLink>
        </template>
        <button v-if="isUnread(alarm.id)" class="btn btn-ghost btn-sm" @click="markAlarmRead(alarm.id)">Sudah baca</button>
      </div>
    </article>

    <p class="tiny muted">
      Peringatan juga tersimpan di sini, jadi tetap bisa dilihat meski pesan Telegram tidak terkirim.
    </p>
  </div>
</template>

<style scoped>
.alarm {
  border-left: 8px solid var(--green-500);
}
.alarm.s-warning {
  border-left-color: var(--amber);
}
.alarm.s-loss {
  border-left-color: var(--red);
}
.alarm.unread {
  background: #fffef2;
}
.new {
  background: var(--red);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 8px;
}
.center {
  text-align: center;
  align-items: center;
}
.big {
  font-size: 56px;
}
</style>
