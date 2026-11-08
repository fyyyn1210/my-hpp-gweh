<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import RiskGauge from "@/components/RiskGauge.vue";
import Sparkline from "@/components/Sparkline.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import TrendTag from "@/components/TrendTag.vue";
import { useStore } from "@/lib/store";
import {
  contributors,
  explanation,
  gramsOf,
  hpp,
  hppChange,
  hppSeries,
  ingredientCost,
  marginOf,
  menuMargin,
  statusOf,
  substituteOptions,
  substituteTarget,
  suggestPrice,
  vulnerability,
} from "@/lib/engine";
import { EXPLAIN_DELAY_MS, ROUNDING_STEPS, TODAY, UNIT_SHORT, WEEK } from "@/lib/constants";
import { percent, rupiah, shortDate } from "@/lib/format";
import { Status, Unit } from "@/lib/types";

const props = defineProps<{ id: string }>();
const router = useRouter();
const store = useStore();

const menu = computed(() => store.getMenu(props.id));

const status = computed(() => (menu.value ? statusOf(menu.value) : Status.Safe));
const cost = computed(() => (menu.value ? hpp(menu.value) : 0));
const margin = computed(() => (menu.value ? menuMargin(menu.value) : 0));
const vuln = computed(() => (menu.value ? vulnerability(menu.value) : null));
const series = computed(() => (menu.value ? hppSeries(menu.value) : []));
const dayLabel = (day: number) => shortDate(new Date(Date.now() - (TODAY - day) * 86_400_000));

const rangeDays = ref(30);
const chartValues = computed(() => series.value.slice(TODAY + 1 - rangeDays.value));
const chartLabels = computed<[string, string]>(() => [dayLabel(TODAY + 1 - rangeDays.value), "Hari ini"]);

const changeDay = computed(() => hppChange(menu.value!, TODAY - 1));
const changeWeek = computed(() => hppChange(menu.value!, TODAY - WEEK));

const topContributors = computed(() =>
  menu.value ? contributors(menu.value, TODAY - WEEK).filter((item) => item.delta > 0).slice(0, 3) : [],
);

const lines = computed(() =>
  menu.value
    ? menu.value.ingredients
        .map((ingredient) => ({ ingredient, cost: ingredientCost(ingredient) }))
        .sort((a, b) => b.cost - a.cost)
    : [],
);
const maxLine = computed(() => Math.max(...lines.value.map((line) => line.cost), 1));

const targetMargin = ref(menu.value?.targetMargin ?? 0.25);
const step = ref(ROUNDING_STEPS[0]);
const suggestion = computed(() => suggestPrice(cost.value, targetMargin.value, step.value));
const priceGap = computed(() => (menu.value ? suggestion.value.rounded - menu.value.sellPrice : 0));

const applyPrice = () => {
  if (!menu.value) return;
  store.updateMenu(menu.value.id, { sellPrice: suggestion.value.rounded, targetMargin: targetMargin.value });
  store.showToast(`Harga jual diubah jadi ${rupiah(suggestion.value.rounded)}`);
};

const explainText = ref<string | null>(null);
const explaining = ref(false);
const explainCache = new Map<string, string>();

const explain = () => {
  if (!menu.value) return;
  const key = `${menu.value.id}-${menu.value.sellPrice}-${TODAY}`;
  const cached = explainCache.get(key);
  if (cached) {
    explainText.value = cached;
    return;
  }
  explaining.value = true;
  setTimeout(() => {
    const text = explanation(menu.value!);
    explainCache.set(key, text);
    explainText.value = text;
    explaining.value = false;
  }, EXPLAIN_DELAY_MS);
};

const subTarget = computed(() => (menu.value ? substituteTarget(menu.value) : null));
const subOptions = computed(() =>
  menu.value && subTarget.value ? substituteOptions(menu.value, subTarget.value) : [],
);
const subShown = ref(false);

const applySubstitute = (index: number) => {
  const option = subOptions.value[index];
  const target = subTarget.value;
  if (!menu.value || !target || !option?.computable) return;
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

const editThreshold = ref(false);
const threshold = ref(menu.value?.threshold ?? 0.2);
const saveThreshold = () => {
  if (!menu.value) return;
  store.updateMenu(menu.value.id, { threshold: threshold.value });
  editThreshold.value = false;
  store.showToast("Batas aman disimpan");
};

const confirmDelete = ref(false);
const remove = () => {
  if (!menu.value) return;
  store.removeMenu(menu.value.id);
  store.showToast("Menu dihapus");
  router.replace("/menu");
};

const actionText = computed(() => {
  if (status.value === Status.Loss) return "Harga jual Anda di bawah modal. Naikkan harga sekarang.";
  if (status.value === Status.Warning) return "Untung menipis. Pertimbangkan naikkan harga jual atau ganti bahan.";
  return vuln.value?.action ?? "";
});
</script>

<template>
  <div v-if="menu" class="stack">
    <PageHead :title="menu.name" back="/menu" />

    <section class="card top" :class="`s-${status}`">
      <div class="row between">
        <div class="row">
          <div class="avatar big-avatar">{{ menu.emoji }}</div>
          <div>
            <p class="small muted">Modal per porsi</p>
            <div class="big-number">{{ rupiah(cost) }}</div>
          </div>
        </div>
        <StatusBadge :status="status" />
      </div>
      <div class="grid-2 facts">
        <div>
          <p class="tiny muted">Harga jual</p>
          <strong class="fact">{{ rupiah(menu.sellPrice) }}</strong>
        </div>
        <div>
          <p class="tiny muted">Untung per porsi</p>
          <strong class="fact">{{ rupiah(menu.sellPrice - cost) }} ({{ percent(margin, 0) }})</strong>
        </div>
      </div>
      <p class="action">{{ actionText }}</p>
    </section>

    <section class="card stack">
      <div class="row between">
        <h2>Naik atau turun?</h2>
      </div>
      <div class="grid-2">
        <div class="tile">
          <p class="tiny muted">Dibanding kemarin</p>
          <TrendTag :value="changeDay" />
        </div>
        <div class="tile">
          <p class="tiny muted">Dibanding minggu lalu</p>
          <TrendTag :value="changeWeek" />
        </div>
      </div>
      <div class="chips">
        <button class="chip" :class="{ active: rangeDays === 7 }" @click="rangeDays = 7">7 hari</button>
        <button class="chip" :class="{ active: rangeDays === 30 }" @click="rangeDays = 30">30 hari</button>
      </div>
      <Sparkline :values="chartValues" :labels="chartLabels" :color="changeWeek > 0.001 ? '#d93025' : '#2f7d32'" />
      <div v-if="topContributors.length" class="stack">
        <h3>Bahan penyebab modal naik (7 hari)</h3>
        <div v-for="item in topContributors" :key="item.ingredient.id" class="row">
          <div class="avatar sm">{{ item.ingredient.emoji }}</div>
          <div class="grow">
            <strong>{{ item.ingredient.name }}</strong>
            <p class="tiny muted">{{ rupiah(item.before) }} → {{ rupiah(item.after) }} per porsi</p>
          </div>
          <span class="up">+{{ rupiah(item.delta) }}</span>
        </div>
      </div>
      <p v-else class="small muted">Tidak ada bahan yang naik minggu ini.</p>
    </section>

    <section class="card stack">
      <h2>Kenapa untung turun?</h2>
      <p class="small muted">Penjelasan singkat dari angka di atas, dalam bahasa sehari-hari.</p>
      <button class="btn btn-soft btn-block" :disabled="explaining" @click="explain">
        {{ explaining ? "Sedang menyusun penjelasan..." : "💡 Jelaskan untuk saya" }}
      </button>
      <div v-if="explainText" class="help-box">
        <p>{{ explainText }}</p>
        <p class="tiny muted ai-note">Disusun AI dari angka mesin. Angka dihitung oleh sistem, bukan AI. (contoh)</p>
      </div>
    </section>

    <section class="card stack">
      <h2>Harga jual yang pas</h2>
      <p class="small muted">Pilih untung yang Anda inginkan, kami hitung harga jualnya.</p>
      <div class="field">
        <label for="target">Untung yang diinginkan: <b>{{ percent(targetMargin, 0) }}</b> dari harga jual</label>
        <input id="target" v-model.number="targetMargin" type="range" min="0.05" max="0.6" step="0.01" class="range" />
      </div>
      <div class="chips">
        <button v-for="value in ROUNDING_STEPS" :key="value" class="chip" :class="{ active: step === value }" @click="step = value">
          Bulatkan {{ rupiah(value) }}
        </button>
      </div>
      <div class="suggest">
        <p class="small muted">Harga jual disarankan</p>
        <div class="big-number">{{ rupiah(suggestion.rounded) }}</div>
        <p class="small">
          Untung sebenarnya {{ percent(suggestion.actualMargin, 1) }}
          <template v-if="priceGap !== 0">
            · <b :class="priceGap > 0 ? 'up' : 'down'">{{ priceGap > 0 ? "+" : "-" }}{{ rupiah(Math.abs(priceGap)) }}</b> dari harga sekarang
          </template>
        </p>
      </div>
      <button class="btn btn-green btn-block" :disabled="suggestion.rounded === menu.sellPrice" @click="applyPrice">
        {{ suggestion.rounded === menu.sellPrice ? "Harga sudah sesuai" : "Pakai harga ini" }}
      </button>
      <p class="tiny muted">Rumus: harga = modal ÷ (1 − untung). Ini untung dari harga jual, bukan tambahan dari modal.</p>
    </section>

    <section v-if="subTarget" class="card stack">
      <h2>Ganti bahan yang mahal</h2>
      <p class="small">
        <b>{{ subTarget.name }}</b> sedang mahal. Ini pilihan pengganti yang sudah kami hitung ulang untuk menu ini.
      </p>
      <button v-if="!subShown" class="btn btn-soft btn-block" @click="subShown = true">Lihat pilihan pengganti</button>
      <template v-else>
        <div v-for="(option, index) in subOptions" :key="option.substitute.name" class="sub" :class="{ off: !option.computable }">
          <div class="row between">
            <strong>{{ option.substitute.name }}</strong>
            <span v-if="option.computable" class="badge" :class="option.saving > 0 ? 'badge-safe' : 'badge-warning'">
              {{ option.saving > 0 ? "Hemat" : "Lebih mahal" }} {{ rupiah(Math.abs(option.saving)) }}
            </span>
            <span v-else class="badge badge-manual">Belum bisa dihitung</span>
          </div>
          <p v-if="option.computable" class="small">Untung jadi <b>{{ percent(option.newMargin, 0) }}</b> · modal {{ rupiah(option.newCost) }}</p>
          <p class="tiny muted">⚠️ {{ option.substitute.note }}</p>
          <button v-if="option.computable" class="btn btn-ghost btn-sm" @click="applySubstitute(index)">Pakai pengganti ini</button>
        </div>
        <p class="tiny muted">Rasa dan mutu bisa berbeda. Putuskan sendiri sesuai pelanggan Anda.</p>
      </template>
    </section>

    <section class="card stack">
      <h2>Isi resep per porsi</h2>
      <div v-for="line in lines" :key="line.ingredient.id" class="stack tight">
        <div class="row">
          <div class="avatar sm">{{ line.ingredient.emoji }}</div>
          <div class="grow">
            <strong>{{ line.ingredient.name }}</strong>
            <p class="tiny muted">
              {{ line.ingredient.qty }} {{ UNIT_SHORT[line.ingredient.unit] }}
              <span class="badge tiny" :class="line.ingredient.commodityId ? 'badge-source' : 'badge-manual'">
                {{ line.ingredient.commodityId ? "harga pasar" : "harga Anda" }}
              </span>
            </p>
          </div>
          <strong>{{ rupiah(line.cost) }}</strong>
        </div>
        <div class="progress"><span :style="{ width: `${(line.cost / maxLine) * 100}%`, background: 'var(--green-500)' }" /></div>
      </div>
      <div class="row between extra">
        <span>Biaya lain (gas, kemasan)</span>
        <strong>{{ rupiah(menu.extraCost) }}</strong>
      </div>
      <div class="row between total">
        <span>Total modal per porsi</span>
        <strong>{{ rupiah(cost) }}</strong>
      </div>
    </section>

    <section v-if="vuln" class="card stack">
      <h2>Seberapa rawan menu ini?</h2>
      <div class="row">
        <div class="gauge-box"><RiskGauge :score="vuln.score" :level="vuln.level" /></div>
        <div class="grow">
          <p class="small">
            <template v-if="vuln.topCommodity">
              Paling terpengaruh oleh <b>{{ vuln.topCommodity.name.toLowerCase() }}</b>, yang harganya sering naik turun.
            </template>
          </p>
          <p class="small"><b>Saran:</b> {{ vuln.action }}</p>
        </div>
      </div>
    </section>

    <section class="card stack">
      <h2>Pengaturan menu</h2>
      <div class="row between">
        <div>
          <strong>Batas aman untung: {{ percent(menu.threshold, 0) }}</strong>
          <p class="tiny muted">Di bawah ini Anda akan diberi peringatan.</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="editThreshold = !editThreshold">Ubah</button>
      </div>
      <div v-if="editThreshold" class="stack">
        <input v-model.number="threshold" type="range" min="0.05" max="0.5" step="0.01" class="range" aria-label="Batas aman" />
        <p>Batas baru: <b>{{ percent(threshold, 0) }}</b></p>
        <button class="btn btn-green btn-sm" @click="saveThreshold">Simpan</button>
      </div>
      <button v-if="!confirmDelete" class="btn btn-danger btn-block" @click="confirmDelete = true">Hapus menu ini</button>
      <div v-else class="stack">
        <p class="small">Yakin hapus <b>{{ menu.name }}</b>? Tindakan ini tidak bisa dibatalkan.</p>
        <div class="grid-2">
          <button class="btn btn-ghost" @click="confirmDelete = false">Batal</button>
          <button class="btn btn-danger" @click="remove">Ya, hapus</button>
        </div>
      </div>
    </section>

    <p class="tiny muted">Harga bahan: contoh data mirip PIHPS Bank Indonesia, tanggal {{ dayLabel(TODAY) }}.</p>
  </div>

  <div v-else class="card stack">
    <h2>Menu tidak ditemukan</h2>
    <RouterLink to="/menu" class="btn btn-green">Kembali ke daftar menu</RouterLink>
  </div>
</template>

<style scoped>
.top {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 3px solid transparent;
}
.top.s-safe {
  border-color: #bfe3b4;
}
.top.s-warning {
  border-color: var(--amber);
}
.top.s-loss {
  border-color: var(--red);
}
.big-avatar {
  width: 64px;
  height: 64px;
  font-size: 36px;
}
.facts {
  background: var(--green-50);
  border-radius: 16px;
  padding: 12px 14px;
}
.fact {
  font-size: 18px;
}
.action {
  font-weight: 700;
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
  border-radius: 13px;
}
.tight {
  gap: 6px;
}
.ai-note {
  margin-top: 8px;
}
.range {
  width: 100%;
  height: 36px;
  accent-color: var(--green-700);
}
.suggest {
  background: linear-gradient(140deg, #fff 0%, #fff9c9 100%);
  border-radius: 18px;
  padding: 16px;
  border: 2px solid var(--yellow);
}
.sub {
  border: 2px solid var(--line);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sub.off {
  opacity: 0.7;
  background: #fafafa;
}
.extra {
  border-top: 2px dashed var(--line);
  padding-top: 12px;
}
.total {
  font-size: 18px;
  background: var(--green-50);
  padding: 12px 14px;
  border-radius: 14px;
}
.gauge-box {
  width: 140px;
  flex: none;
}
</style>
