<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.vue";
import SourceTag from "./SourceTag.vue";
import StatusBadge from "./StatusBadge.vue";
import TrendTag from "./TrendTag.vue";
import { CardKind, type Card } from "@/lib/assistant";
import { useStore } from "@/lib/store";
import {
  cateringQuote,
  communityStats,
  hpp,
  marginOf,
  menuMargin,
  pihpsPrice,
  portionCut,
  priceInfo,
  statusOf,
  substituteOptions,
  substituteTarget,
  suggestPrice,
} from "@/lib/engine";
import { BUY_UNITS, MS_PER_DAY, PORTION_CUT_LIMIT, TODAY, WEEK } from "@/lib/constants";
import { dayLabel, longDate, percent, rupiah, thousands } from "@/lib/format";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ send: [text: string] }>();
const router = useRouter();
const store = useStore();
const { state } = store;

const menu = computed(() => ("menuId" in props.card ? store.getMenu(props.card.menuId) : undefined));
const commodity = computed(() => ("commodityId" in props.card ? store.commodityMap[props.card.commodityId] : undefined));

const quote = computed(() =>
  props.card.kind === CardKind.Quote && menu.value
    ? cateringQuote(menu.value, props.card.portions, props.card.daysAhead, props.card.margin, state.roundingStep)
    : null,
);

const actions = computed(() => {
  if (props.card.kind !== CardKind.Actions || !menu.value) return null;
  const target = substituteTarget(menu.value);
  return {
    price: suggestPrice(hpp(menu.value), menu.value.targetMargin, state.roundingStep),
    cut: portionCut(menu.value),
    target,
    swap: target ? substituteOptions(menu.value, target).find((option) => option.computable && option.saving > 0) : undefined,
  };
});

const price = computed(() => {
  if (props.card.kind !== CardKind.Price || !commodity.value) return null;
  return {
    info: priceInfo(commodity.value),
    community: communityStats(commodity.value),
    change: pihpsPrice(commodity.value) / pihpsPrice(commodity.value, TODAY - WEEK) - 1,
  };
});

const nota = computed(() => {
  if (props.card.kind !== CardKind.NotaDraft) return null;
  const unit = BUY_UNITS.find((item) => item.key === (props.card as { unitKey: string }).unitKey)!;
  return { unit, perKg: Math.round(props.card.total / (props.card.amount * unit.perKg)) };
});

const ranking = computed(() => store.ranking.value.slice(0, 3));

const saveNota = () => {
  if (props.card.kind !== CardKind.NotaDraft || !nota.value) return;
  store.addNota({ commodityId: props.card.commodityId, pricePerKg: nota.value.perKg, shared: state.shareCommunity });
  props.card.done = true;
};

const savePrice = () => {
  if (props.card.kind !== CardKind.PriceDraft) return;
  store.setSellPrice(props.card.menuId, props.card.price);
  store.showToast(`Harga jual sekarang ${rupiah(props.card.price)}`);
  props.card.done = true;
};

const copyOffer = async () => {
  if (props.card.kind !== CardKind.Quote || !quote.value || !menu.value) return;
  const text = [
    `Penawaran ${menu.value.name}`,
    `Acara: ${longDate(new Date(Date.now() + props.card.daysAhead * MS_PER_DAY))}`,
    `Jumlah: ${props.card.portions} porsi`,
    `Harga: ${rupiah(quote.value.buffered.rounded)} per porsi`,
    `Total: ${rupiah(quote.value.totalBuffered)}`,
    `Dari ${state.ownerName}`,
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    store.showToast("Teks penawaran disalin");
  } catch {
    store.showToast("Gagal menyalin, salin manual");
  }
};
</script>

<template>
  <div v-if="card.kind === CardKind.Quote && quote && menu" class="rounded-[30px] bg-white p-1.5 shadow-soft">
    <div class="card-lime flex flex-col gap-1.5">
      <p class="text-small">{{ menu.emoji }} {{ menu.name }} · {{ card.portions }} porsi</p>
      <p class="big-number my-1 text-[48px]"><span class="cur">Rp</span>{{ thousands(quote.buffered.rounded) }}</p>
      <p class="text-small">per porsi · total <b class="num">{{ rupiah(quote.totalBuffered) }}</b></p>
      <div class="mt-1.5 grid grid-cols-3 gap-2 rounded-field bg-white/70 px-3 py-3">
        <div>
          <p class="text-tiny">Tanpa cadangan</p>
          <p class="num font-semibold">{{ rupiah(quote.plain.rounded) }}</p>
        </div>
        <div>
          <p class="text-tiny">Cadangan</p>
          <p class="num font-semibold">+{{ rupiah(quote.buffered.rounded - quote.plain.rounded) }}</p>
        </div>
        <div>
          <p class="text-tiny">Perkiraan untung</p>
          <p class="num font-semibold">{{ rupiah(quote.profit) }}</p>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2 px-3 pt-3 pb-2">
      <p v-for="line in quote.lines.filter((item) => item.risk >= 1).slice(0, 2)" :key="line.ingredient.id" class="text-tiny text-ink-2">
        {{ line.ingredient.emoji }} {{ line.ingredient.name }} bisa naik sampai {{ percent(line.buffer, 0) }}
      </p>
      <button class="btn w-full" @click="copyOffer"><Icon name="copy" :size="20" />Salin teks penawaran</button>
    </div>
  </div>

  <div v-else-if="card.kind === CardKind.Status && menu" class="card flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <span class="avatar avatar-sm">{{ menu.emoji }}</span>
      <strong class="min-w-0 flex-1">{{ menu.name }}</strong>
      <StatusBadge :status="statusOf(menu)" />
    </div>
    <div class="grid grid-cols-3 gap-2 rounded-field bg-mist px-3.5 py-3">
      <div>
        <p class="text-tiny text-ink-2">Untung dulu</p>
        <p class="num font-semibold">{{ percent(menuMargin(menu, menu.priceSetDay), 0) }}</p>
      </div>
      <div>
        <p class="text-tiny text-ink-2">Sekarang</p>
        <p class="num font-semibold">{{ percent(menuMargin(menu), 0) }}</p>
      </div>
      <div>
        <p class="text-tiny text-ink-2">Modal</p>
        <p class="num font-semibold">{{ rupiah(hpp(menu)) }}</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <button class="btn btn-sm btn-light" @click="emit('send', `${menu.name} harus naik berapa?`)">Pilihan tindakan</button>
      <button class="btn btn-sm btn-white" @click="router.push(`/menu/${menu.id}`)">Buka menu</button>
    </div>
  </div>

  <div v-else-if="card.kind === CardKind.Actions && actions && menu" class="list">
    <div class="list-row">
      <span class="avatar avatar-sm bg-ink text-white"><Icon name="tag" :size="20" /></span>
      <div class="min-w-0 flex-1">
        <strong>Naikkan harga jadi {{ rupiah(actions.price.rounded) }}</strong>
        <p class="text-tiny text-ink-2">Untung kembali {{ percent(actions.price.actualMargin, 0) }}</p>
      </div>
      <button v-if="actions.price.rounded !== menu.sellPrice" class="btn btn-sm" @click="emit('send', `Harga ${menu.name} jadi ${actions.price.rounded}`)">Pakai</button>
    </div>
    <div class="list-row">
      <span class="avatar avatar-sm"><Icon name="minus" :size="20" /></span>
      <div class="min-w-0 flex-1">
        <strong v-if="actions.cut > 0.005">Kurangi porsi sekitar {{ percent(actions.cut, 0) }}</strong>
        <strong v-else>Porsi tidak perlu dikurangi</strong>
        <p v-if="actions.cut > PORTION_CUT_LIMIT" class="text-tiny text-ink-2">Terlalu banyak, lebih baik naikkan harga.</p>
      </div>
    </div>
    <button v-if="actions.target && actions.swap" class="list-row text-left" @click="router.push(`/menu/${menu.id}`)">
      <span class="avatar avatar-sm"><Icon name="swap" :size="20" /></span>
      <div class="min-w-0 flex-1">
        <strong>Ganti {{ actions.target.name.toLowerCase() }} dengan {{ actions.swap.substitute.name.toLowerCase() }}</strong>
        <p class="text-tiny text-ink-2">Hemat {{ rupiah(actions.swap.saving) }}, untung jadi {{ percent(actions.swap.newMargin, 0) }}</p>
      </div>
      <Icon name="next" :size="20" />
    </button>
  </div>

  <div v-else-if="card.kind === CardKind.Price && price && commodity" class="card flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <span class="avatar avatar-sm">{{ commodity.emoji }}</span>
      <strong class="min-w-0 flex-1">{{ commodity.name }}</strong>
      <TrendTag :value="price.change" />
    </div>
    <p class="num text-[28px] font-semibold">{{ rupiah(price.info.price) }}<span class="text-small font-normal text-ink-2">/{{ commodity.priceUnit }}</span></p>
    <div class="flex flex-wrap items-center gap-2">
      <SourceTag :source="price.info.source" :day="price.info.day" />
      <span v-if="price.community" class="text-tiny text-ink-2">Komunitas: {{ rupiah(price.community.median) }} dari {{ price.community.count }} pedagang</span>
    </div>
    <button class="btn btn-sm btn-light" @click="router.push(`/nota?bahan=${commodity.id}`)"><Icon name="receipt" :size="18" />Catat harga belanja saya</button>
  </div>

  <div v-else-if="card.kind === CardKind.NotaDraft && nota && commodity" class="card flex flex-col gap-3" :class="!card.done && 'ring-2 ring-ink'">
    <div class="flex items-center gap-3">
      <span class="avatar avatar-sm">{{ commodity.emoji }}</span>
      <div class="min-w-0 flex-1">
        <strong>{{ commodity.name }}</strong>
        <p class="text-tiny text-ink-2">{{ card.amount }} {{ nota.unit.label }} · {{ rupiah(card.total) }} · {{ dayLabel(TODAY) }}</p>
      </div>
    </div>
    <div class="flex items-center justify-between rounded-field bg-mist px-4 py-3">
      <span>Harga per {{ commodity.priceUnit }}</span>
      <b class="num">{{ rupiah(nota.perKg) }}</b>
    </div>
    <p v-if="card.done" class="flex items-center gap-2 font-semibold text-brand-deep"><Icon name="check" :size="20" />Tersimpan</p>
    <div v-else class="grid grid-cols-2 gap-2">
      <button class="btn btn-sm btn-white" @click="router.push(`/nota?bahan=${commodity.id}`)">Ubah</button>
      <button class="btn btn-sm" @click="saveNota">Simpan</button>
    </div>
  </div>

  <div v-else-if="card.kind === CardKind.PriceDraft && menu" class="card flex flex-col gap-3" :class="!card.done && 'ring-2 ring-ink'">
    <div class="flex items-center gap-3">
      <span class="avatar avatar-sm">{{ menu.emoji }}</span>
      <strong class="min-w-0 flex-1">{{ menu.name }}</strong>
    </div>
    <div class="grid grid-cols-2 gap-2 rounded-field bg-mist px-3.5 py-3">
      <div>
        <p class="text-tiny text-ink-2">Harga jual baru</p>
        <p class="num font-semibold">{{ rupiah(card.price) }}</p>
      </div>
      <div>
        <p class="text-tiny text-ink-2">Untung jadi</p>
        <p class="num font-semibold">{{ percent(marginOf(card.price, hpp(menu)), 0) }}</p>
      </div>
    </div>
    <p v-if="card.done" class="flex items-center gap-2 font-semibold text-brand-deep"><Icon name="check" :size="20" />Tersimpan</p>
    <button v-else class="btn btn-sm" @click="savePrice">Simpan harga baru</button>
  </div>

  <div v-else-if="card.kind === CardKind.Ranking" class="list">
    <button v-for="item in ranking" :key="item.menu.id" class="list-row text-left" @click="router.push(`/menu/${item.menu.id}`)">
      <span class="avatar avatar-sm">{{ item.menu.emoji }}</span>
      <div class="min-w-0 flex-1">
        <strong>{{ item.menu.name }}</strong>
        <p class="text-tiny text-ink-2">Untung {{ percent(menuMargin(item.menu), 0) }} · {{ item.vuln.action }}</p>
      </div>
      <StatusBadge :status="statusOf(item.menu)" />
    </button>
  </div>
</template>
