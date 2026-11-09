<script setup lang="ts">
import FoodIcon from "@/components/FoodIcon.vue";
import Tip from "@/components/Tip.vue";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { AnimatePresence, motion } from "motion-v";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import RiskGauge from "@/components/RiskGauge.vue";
import SourceTag from "@/components/SourceTag.vue";
import Sparkline from "@/components/Sparkline.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useStore } from "@/lib/store";
import {
  contributors,
  erosion,
  explanation,
  gramsOf,
  hpp,
  marginOf,
  marginSteps,
  hppSeries,
  ingredientCost,
  ingredientPriceInfo,
  menuMargin,
  portionCut,
  statusOf,
  substituteOptions,
  substituteTarget,
  suggestPrice,
  vulnerability,
} from "@/lib/engine";
import {
  EXPLAIN_DELAY_MS,
  Formula,
  MARGIN_CHOICES,
  PORTION_CUT_LIMIT,
  RANGE_CHOICES,
  ROUNDING_STEPS,
  TODAY,
  UNIT_SHORT,
} from "@/lib/constants";
import { dayLabel, percent, points, rupiah, thousands } from "@/lib/format";
import { Status, Unit } from "@/lib/types";

const props = defineProps<{ id: string }>();
const router = useRouter();
const store = useStore();

const menu = computed(() => store.getMenu(props.id));

const status = computed(() => (menu.value ? statusOf(menu.value) : Status.Safe));
const cost = computed(() => (menu.value ? hpp(menu.value) : 0));
const margin = computed(() => (menu.value ? menuMargin(menu.value) : 0));
const marginThen = computed(() => (menu.value ? menuMargin(menu.value, menu.value.priceSetDay) : 0));
const drop = computed(() => (menu.value ? erosion(menu.value) : 0));
const vuln = computed(() => (menu.value ? vulnerability(menu.value) : null));

const range = ref(RANGE_CHOICES[1]);
const menuAge = computed(() => TODAY - (menu.value?.createdDay ?? -Infinity) + 1);
const ranges = computed(() => RANGE_CHOICES.filter((days, index) => index === 0 || RANGE_CHOICES[index - 1] < menuAge.value));
const chartDays = computed(() => Math.max(1, Math.min(range.value, menuAge.value)));
const chartStart = computed(() => TODAY + 1 - chartDays.value);
const chartValues = computed(() => (menu.value ? hppSeries(menu.value, chartDays.value) : []));
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const describeDay = (from: number, to: number, value: number) =>
  from === to
    ? `${capitalize(dayLabel(chartStart.value + from))}: modal ${rupiah(value)}`
    : `${capitalize(dayLabel(chartStart.value + from))} – ${dayLabel(chartStart.value + to)}: rata-rata modal ${rupiah(value)}`;
const chartChange = computed(() => {
  const start = chartValues.value[0] ?? 0;
  const delta = cost.value - start;
  return { start, delta, pct: start > 0 ? delta / start : 0 };
});

const since = computed(() => menu.value?.priceSetDay ?? TODAY);
const topContributors = computed(() =>
  menu.value ? contributors(menu.value, since.value).filter((item) => item.delta >= 1).slice(0, 3) : [],
);

const lines = computed(() =>
  menu.value
    ? menu.value.ingredients
        .map((ingredient) => ({ ingredient, cost: ingredientCost(ingredient), info: ingredientPriceInfo(ingredient) }))
        .sort((a, b) => b.cost - a.cost)
    : [],
);

const targetMargin = ref(menu.value?.targetMargin ?? 0.3);
const step = ref(store.state.roundingStep);
const suggestion = computed(() => suggestPrice(cost.value, targetMargin.value, step.value));
const priceGap = computed(() => (menu.value ? suggestion.value.rounded - menu.value.sellPrice : 0));
const cut = computed(() => (menu.value ? portionCut(menu.value) : 0));
const barColor = computed(() => (status.value === Status.Safe ? "#13945a" : status.value === Status.Warning ? "#e0a100" : "#d63a33"));
const needsAction = computed(() => status.value !== Status.Safe || drop.value > 0.05);

const applyPrice = () => {
  if (!menu.value) return;
  store.updateMenu(menu.value.id, { targetMargin: targetMargin.value });
  store.setSellPrice(menu.value.id, suggestion.value.rounded);
  store.showToast(`Harga jual sekarang ${rupiah(suggestion.value.rounded)}`);
};

const ownPrice = ref(menu.value?.sellPrice ?? 0);
watch(() => menu.value?.sellPrice, (price) => (ownPrice.value = price ?? 0));
const ownPriceChanged = computed(() => !!menu.value && ownPrice.value > 0 && ownPrice.value !== menu.value.sellPrice);

const saveOwnPrice = () => {
  if (!menu.value) return;
  if (!(ownPrice.value > 0)) {
    document.getElementById("own-price")?.focus();
    return;
  }
  if (!ownPriceChanged.value) return;
  store.setSellPrice(menu.value.id, ownPrice.value);
  store.showToast(`Harga jual sekarang ${rupiah(ownPrice.value)}`);
};

const explainText = ref<string | null>(null);
const explaining = ref(false);

const explain = () => {
  if (!menu.value) return;
  explaining.value = true;
  setTimeout(() => {
    explainText.value = explanation(menu.value!);
    explaining.value = false;
  }, EXPLAIN_DELAY_MS);
};

const subTarget = computed(() => (menu.value ? substituteTarget(menu.value) : null));
const subOptions = computed(() =>
  menu.value && subTarget.value ? substituteOptions(menu.value, subTarget.value).filter((option) => option.computable) : [],
);
const subShown = ref(false);

const applySubstitute = (index: number) => {
  const option = subOptions.value[index];
  const target = subTarget.value;
  if (!menu.value || !target || !option) return;
  const alt = option.substitute;
  const ingredients = menu.value.ingredients.map((ingredient) =>
    ingredient.id === target.id
      ? {
          ...ingredient,
          name: alt.name,
          qty: Math.round(gramsOf(ingredient) * alt.ratio),
          unit: Unit.Gram,
          commodityId: alt.altCommodityId,
          manualPricePerKg: alt.altCommodityId ? null : (alt.manualPricePerKg ?? null),
        }
      : ingredient,
  );
  store.updateMenu(menu.value.id, { ingredients });
  subShown.value = false;
  store.showToast(`${target.name} diganti ${alt.name}`);
};

const thresholdChoices = [0.1, 0.15, 0.2, 0.25];
const setThreshold = (value: number) => {
  if (!menu.value) return;
  store.updateMenu(menu.value.id, { threshold: value });
  store.showToast(`Batas aman jadi ${percent(value, 0)}`);
};

const confirmDelete = ref(false);
const remove = () => {
  if (!menu.value) return;
  store.removeMenu(menu.value.id);
  store.showToast("Menu dihapus");
  router.replace("/menu");
};
</script>

<template>
  <div v-if="menu" class="flex flex-col gap-5.5">
    <PageHead :title="menu.name" back="/menu">
      <span class="avatar"><FoodIcon :name="menu.icon" /></span>
    </PageHead>

    <section class="card-lime flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <p class="font-medium">Untung per porsi sekarang</p>
        <StatusBadge :status="status" />
      </div>
      <div class="flex items-end gap-4">
        <motion.div :key="margin" class="big-number text-[68px]" :initial="{ opacity: 0, y: 8 }" :animate="{ opacity: 1, y: 0 }"><Tip :kind="Formula.Margin" :calc="marginSteps(menu.sellPrice, cost)">{{ percent(margin, 0) }}</Tip></motion.div>
        <div class="pb-1.5">
          <p class="num font-semibold">{{ rupiah(menu.sellPrice - cost) }}</p>
          <p class="text-tiny">per porsi</p>
        </div>
      </div>
      <div class="flex flex-col gap-1.5 rounded-field bg-white/70 px-4 py-3.5">
        <div class="flex justify-between gap-3 text-[14.5px]">
          <span>Saat harga {{ rupiah(menu.sellPrice) }} ditetapkan ({{ dayLabel(menu.priceSetDay) }})</span>
          <b class="num"><Tip :kind="Formula.MarginThen" :calc="marginSteps(menu.sellPrice, hpp(menu, menu.priceSetDay))">{{ percent(marginThen, 0) }}</Tip></b>
        </div>
        <div class="bar bg-ink/8">
          <motion.span :initial="{ width: 0 }" :animate="{ width: `${Math.max(marginThen, 0) * 200}%` }" class="bg-[#7b8a80]!" />
        </div>
        <div class="flex justify-between gap-3 text-[14.5px]">
          <span>Sekarang</span>
          <b class="num"><Tip :kind="Formula.Margin" :calc="marginSteps(menu.sellPrice, cost)">{{ percent(margin, 0) }}</Tip></b>
        </div>
        <div class="relative h-2.5 rounded-full bg-ink/8">
          <motion.span
            class="block h-full rounded-full"
            :initial="{ width: 0 }"
            :animate="{ width: `${Math.max(margin, 0) * 200}%` }"
            :transition="{ delay: 0.15 }"
            :style="{ background: barColor }"
          />
          <span class="absolute -top-1 -bottom-1 w-[3px] rounded-sm bg-ink" :style="{ left: `${menu.threshold * 200}%` }" />
        </div>
        <p class="text-tiny">Garis tegak = batas aman Anda <Tip :kind="Formula.Threshold">{{ percent(menu.threshold, 0) }}</Tip></p>
      </div>
      <p v-if="drop > 0.005">Untung turun <b><Tip :kind="Formula.Erosion">{{ points(drop) }}</Tip></b> karena harga bahan naik.</p>
      <p v-else>Untung masih sama seperti saat harga ditetapkan.</p>
    </section>

    <section class="flex flex-col gap-3.5">
      <div class="section-head"><h2>{{ needsAction ? "Pilihan tindakan" : "Belum perlu tindakan" }}</h2></div>
      <div class="list">
        <div class="list-row">
          <span class="avatar avatar-sm bg-ink text-white"><Icon name="tag" :size="20" /></span>
          <div class="min-w-0 flex-1">
            <strong>Naikkan harga jadi {{ rupiah(suggestion.rounded) }}</strong>
            <p class="text-tiny text-ink-2">
              <template v-if="priceGap > 0">Naik {{ rupiah(priceGap) }} sekaligus. </template>
              Untung kembali <Tip :kind="Formula.MarginNew" :calc="marginSteps(suggestion.rounded, cost)">{{ percent(suggestion.actualMargin, 0) }}</Tip>.
            </p>
          </div>
          <button class="btn btn-sm" :disabled="priceGap === 0" @click="applyPrice">{{ priceGap === 0 ? "Sudah" : "Pakai" }}</button>
        </div>
        <div class="list-row">
          <span class="avatar avatar-sm"><Icon name="minus" :size="20" /></span>
          <div class="min-w-0 flex-1">
            <strong v-if="cut > 0.005">Kurangi porsi sekitar <Tip :kind="Formula.PortionCut">{{ percent(cut, 0) }}</Tip></strong>
            <strong v-else>Porsi tidak perlu dikurangi</strong>
            <p class="text-tiny text-ink-2">
              <template v-if="cut > PORTION_CUT_LIMIT">Terlalu banyak, pelanggan bisa kecewa. Lebih baik naikkan harga.</template>
              <template v-else-if="cut > 0.005">Harga tetap {{ rupiah(menu.sellPrice) }}, untung kembali <Tip :kind="Formula.Target">{{ percent(menu.targetMargin, 0) }}</Tip>.</template>
              <template v-else>Untung masih sesuai target <Tip :kind="Formula.Target">{{ percent(menu.targetMargin, 0) }}</Tip>.</template>
            </p>
          </div>
        </div>
        <div v-if="subTarget && subOptions.length" class="list-row flex-col items-stretch">
          <div class="flex items-center gap-3">
            <span class="avatar avatar-sm"><Icon name="swap" :size="20" /></span>
            <div class="min-w-0 flex-1">
              <strong>Ganti {{ subTarget.name.toLowerCase() }}</strong>
              <p class="text-tiny text-ink-2">Bahan ini sedang mahal. {{ subOptions.length }} pengganti sudah dihitung ulang.</p>
            </div>
            <button class="btn btn-sm btn-light" @click="subShown = !subShown">{{ subShown ? "Tutup" : "Lihat" }}</button>
          </div>
          <AnimatePresence>
            <motion.div
              v-if="subShown"
              class="flex flex-col gap-3 overflow-hidden"
              :initial="{ height: 0, opacity: 0 }"
              :animate="{ height: 'auto', opacity: 1 }"
              :exit="{ height: 0, opacity: 0 }"
            >
              <div v-for="(option, index) in subOptions" :key="option.substitute.name" class="flex flex-col gap-1.5 rounded-field bg-mist p-3.5 first:mt-1.5">
                <div class="flex items-center justify-between gap-3">
                  <strong>{{ option.substitute.name }}</strong>
                  <span class="badge" :class="option.saving > 0 ? 'bg-brand-soft text-brand-deep' : 'bg-warn-soft text-[#835600]'">
                    {{ option.saving > 0 ? "Hemat" : "Lebih mahal" }} {{ rupiah(Math.abs(option.saving)) }}
                  </span>
                </div>
                <p class="text-small">Untung jadi <b><Tip :kind="Formula.MarginNew" :calc="marginSteps(menu.sellPrice, option.newCost)">{{ percent(option.newMargin, 0) }}</Tip></b></p>
                <p class="text-tiny text-ink-2">Catatan rasa: {{ option.substitute.note }}</p>
                <button class="btn btn-sm btn-white self-start" @click="applySubstitute(index)">Pakai pengganti ini</button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>

    <section class="card flex flex-col gap-3.5">
      <div class="flex items-center gap-3">
        <span class="avatar avatar-sm bg-lime"><Icon name="sparkles" :size="20" /></span>
        <div class="min-w-0 flex-1">
          <h2>Kenapa untung turun?</h2>
          <p class="text-tiny text-ink-2">Penjelasan singkat dalam bahasa sehari-hari</p>
        </div>
      </div>
      <motion.div v-if="explainText" class="note" :initial="{ opacity: 0, y: 8 }" :animate="{ opacity: 1, y: 0 }">
        <p>{{ explainText }}</p>
      </motion.div>
      <p v-if="explainText" class="text-tiny text-ink-2">Kalimat disusun AI dari angka sistem. Angka dihitung sistem, bukan AI. (contoh)</p>
      <button v-else class="btn btn-light w-full" :disabled="explaining" @click="explain">
        {{ explaining ? "Sedang menyusun..." : "Jelaskan untuk saya" }}
      </button>
      <button class="btn btn-white w-full" @click="router.push(`/tanya?menu=${menu.id}`)"><Icon name="chat" :size="20" />Tanya soal menu ini</button>
    </section>

    <section class="card flex flex-col gap-3.5">
      <div class="flex items-center justify-between gap-3">
        <h2>Modal per porsi</h2>
        <strong class="num text-xl">{{ rupiah(cost) }}</strong>
      </div>
      <div v-if="ranges.length > 1" class="seg">
        <button v-for="days in ranges" :key="days" :class="{ active: chartDays === Math.min(days, menuAge) }" @click="range = days">{{ days }} hari terakhir</button>
      </div>
      <p class="text-small">
        <template v-if="chartDays === 1">Menu ini baru dibuat hari ini. Grafik modal akan terisi mulai besok.</template>
        <template v-else-if="Math.abs(chartChange.delta) < 1">Sejak {{ dayLabel(chartStart) }} modal 1 porsi stabil di <b class="num">{{ rupiah(cost) }}</b>.</template>
        <template v-else>
          Modal 1 porsi {{ chartChange.delta > 0 ? "naik" : "turun" }} dari <b class="num">{{ rupiah(chartChange.start) }}</b> ({{ dayLabel(chartStart) }})
          jadi <b class="num">{{ rupiah(cost) }}</b> hari ini,
          <b class="num" :class="chartChange.delta > 0 ? 'text-danger' : 'text-brand-deep'">{{ chartChange.delta > 0 ? "+" : "−" }}{{ rupiah(Math.abs(chartChange.delta)) }} ({{ percent(Math.abs(chartChange.pct), 0) }})</b>.
        </template>
      </p>
      <Sparkline
        v-if="chartDays > 1"
        :values="chartValues"
        :labels="[capitalize(dayLabel(chartStart)), 'Hari ini']"
        :accent="drop > 0.005 ? '#d63a33' : '#13945a'"
        :describe="describeDay"
      />
      <p v-if="chartDays > 1" class="text-tiny text-ink-2">
        Tiap kolom titik = modal 1 porsi pada hari itu. Makin tinggi kolomnya, makin mahal modalnya. Ketuk kolom untuk melihat tanggal dan modalnya.
        <template v-if="chartDays < range">Grafik dimulai dari hari menu ini dibuat.</template>
      </p>
      <div v-if="topContributors.length" class="flex flex-col gap-1.5">
        <p class="label">Bahan penyebab modal naik sejak {{ dayLabel(since) }}</p>
        <div v-for="item in topContributors" :key="item.ingredient.id" class="flex items-center gap-3 py-1">
          <span class="avatar avatar-sm"><FoodIcon :name="item.ingredient.icon" :size="22" /></span>
          <div class="min-w-0 flex-1">
            <strong>{{ item.ingredient.name }}</strong>
            <p class="num text-tiny text-ink-2">{{ rupiah(item.before) }} → {{ rupiah(item.after) }} per porsi</p>
          </div>
          <span class="num font-semibold text-danger">+{{ rupiah(item.delta) }}</span>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3.5">
      <div class="section-head">
        <h2>Isi resep 1 porsi</h2>
        <RouterLink to="/nota">Catat harga <Icon name="next" :size="18" /></RouterLink>
      </div>
      <div class="list">
        <div v-for="line in lines" :key="line.ingredient.id" class="list-row">
          <span class="avatar avatar-sm"><FoodIcon :name="line.ingredient.icon" :size="22" /></span>
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <div class="flex items-center justify-between gap-3">
              <strong>{{ line.ingredient.name }}</strong>
              <strong class="num">{{ rupiah(line.cost) }}</strong>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <span class="num text-tiny text-ink-2">{{ line.ingredient.qty }} {{ UNIT_SHORT[line.ingredient.unit] }} · {{ rupiah(line.info.price) }}/kg</span>
              <SourceTag :source="line.info.source" :day="line.info.day" />
            </div>
            <div class="bar h-1.5"><span :style="{ width: `${(line.cost / cost) * 100}%` }" /></div>
          </div>
        </div>
        <div class="list-row">
          <span class="avatar avatar-sm"><Icon name="store" :size="20" /></span>
          <span class="min-w-0 flex-1">Gas, kemasan, dll.</span>
          <strong class="num">{{ rupiah(menu.extraCost) }}</strong>
        </div>
        <div class="list-row min-h-[60px] bg-mist text-[17px]">
          <span class="min-w-0 flex-1">Total modal</span>
          <strong class="num">{{ rupiah(cost) }}</strong>
        </div>
      </div>
    </section>

    <section class="card flex flex-col gap-3.5">
      <div class="flex items-center gap-3">
        <span class="avatar avatar-sm"><Icon name="tag" :size="20" /></span>
        <h2 class="flex-1">Harga jual Anda</h2>
      </div>
      <label for="own-price" class="label">Ketik harga jual per porsi</label>
      <div class="input-money">
        <span>Rp</span>
        <input id="own-price" v-model.number="ownPrice" type="number" min="0" inputmode="numeric" />
      </div>
      <p v-if="ownPrice > 0" class="text-small">
        Untung <b class="num">{{ rupiah(ownPrice - cost) }}</b> per porsi
        (<Tip :kind="Formula.MarginNew" :calc="marginSteps(ownPrice, cost)">{{ percent(marginOf(ownPrice, cost), 0) }}</Tip>)
      </p>
      <p v-else class="flex items-center gap-2 text-small font-semibold text-warn"><Icon name="info" :size="18" class="flex-none" />Isi harga jual dulu.</p>
      <button class="btn w-full" :aria-disabled="!ownPriceChanged" @click="saveOwnPrice">
        {{ ownPriceChanged || !(ownPrice > 0) ? "Simpan harga jual" : "Harga jual sudah tersimpan" }}
      </button>
    </section>

    <section class="card flex flex-col gap-3.5">
      <div class="flex items-center gap-3">
        <span class="avatar avatar-sm"><Icon name="calculator" :size="20" /></span>
        <h2 class="flex-1">Hitung harga jual</h2>
      </div>
      <p class="label">Mau untung berapa persen dari harga jual?</p>
      <div class="chips">
        <button v-for="value in MARGIN_CHOICES" :key="value" class="chip" :class="{ active: targetMargin === value }" @click="targetMargin = value">
          {{ percent(value, 0) }}
        </button>
      </div>
      <p class="label">Bulatkan ke</p>
      <div class="seg">
        <button v-for="value in ROUNDING_STEPS" :key="value" :class="{ active: step === value }" @click="step = value">Rp {{ thousands(value) }}</button>
      </div>
      <div class="flex flex-col gap-1.5 rounded-field bg-mist p-[18px]">
        <p class="text-small text-ink-2">Harga jual yang disarankan</p>
        <motion.p :key="suggestion.rounded" class="big-number" :initial="{ opacity: 0.3, y: 6 }" :animate="{ opacity: 1, y: 0 }">
          <span class="cur">Rp</span>{{ thousands(suggestion.rounded) }}
        </motion.p>
        <p class="text-small">Untung sebenarnya <Tip :kind="Formula.MarginNew" :calc="marginSteps(suggestion.rounded, cost)">{{ percent(suggestion.actualMargin, 1) }}</Tip> · {{ rupiah(suggestion.rounded - cost) }} per porsi</p>
      </div>
      <button class="btn w-full" :disabled="priceGap === 0" @click="applyPrice">
        {{ priceGap === 0 ? "Harga jual sudah sesuai" : `Pakai ${rupiah(suggestion.rounded)}` }}
      </button>
      <p class="text-tiny text-ink-2">Rumus: harga = modal ÷ (1 − untung). Untung dihitung dari harga jual, bukan dari modal.</p>
    </section>

    <section v-if="vuln" class="card flex items-center gap-3">
      <div class="w-[130px] flex-none"><RiskGauge :score="vuln.score" :level="vuln.level" /></div>
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3>Seberapa rawan?</h3>
        <p v-if="vuln.topCommodity" class="text-small">Paling terpengaruh <b>{{ vuln.topCommodity.name.toLowerCase() }}</b>, yang harganya sering naik turun.</p>
        <p class="text-small text-ink-2">{{ vuln.action }}</p>
      </div>
    </section>

    <section class="card flex flex-col gap-3.5">
      <h2>Pengaturan menu</h2>
      <p class="label">Beri peringatan bila untung di bawah</p>
      <div class="chips">
        <button v-for="value in thresholdChoices" :key="value" class="chip" :class="{ active: menu.threshold === value }" @click="setThreshold(value)">
          {{ percent(value, 0) }}
        </button>
      </div>
      <hr class="border-line" />
      <button v-if="!confirmDelete" class="btn btn-danger w-full" @click="confirmDelete = true"><Icon name="trash" :size="20" />Hapus menu</button>
      <div v-else class="flex flex-col gap-3.5">
        <p class="text-small">Yakin hapus <b>{{ menu.name }}</b>? Tidak bisa dibatalkan.</p>
        <div class="grid grid-cols-2 gap-3">
          <button class="btn btn-light" @click="confirmDelete = false">Batal</button>
          <button class="btn btn-danger" @click="remove">Ya, hapus</button>
        </div>
      </div>
    </section>
  </div>

  <div v-else class="card flex flex-col gap-3.5">
    <h2>Menu tidak ditemukan</h2>
    <RouterLink to="/menu" class="btn">Kembali ke daftar menu</RouterLink>
  </div>
</template>
