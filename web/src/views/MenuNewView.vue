<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useStore } from "@/lib/store";
import { hpp, menuMargin, parseRecipeText, SAMPLE_RECIPE, statusOf, suggestPrice } from "@/lib/engine";
import { PARSE_DELAY_MS, ROUNDING_STEPS, UNIT_LABELS } from "@/lib/constants";
import { percent, rupiah, uid } from "@/lib/format";
import { Unit, type Ingredient, type Menu } from "@/lib/types";

const router = useRouter();
const store = useStore();

const step = ref<1 | 2 | 3>(1);
const name = ref("");
const emoji = ref("🍽️");
const recipeText = ref("");
const parsing = ref(false);
const ingredients = ref<Ingredient[]>([]);
const sellPrice = ref(15000);
const targetMargin = ref(0.25);
const extraCost = ref(1000);

const emojis = ["🍽️", "🍗", "🍚", "🍜", "🥗", "🍲", "🥚", "🐟", "🍢", "☕"];
const unitOptions = Object.values(Unit);

const draft = computed<Menu>(() => ({
  id: "draft",
  name: name.value || "Menu baru",
  emoji: emoji.value,
  sellPrice: sellPrice.value,
  targetMargin: targetMargin.value,
  threshold: 0.2,
  extraCost: extraCost.value,
  ingredients: ingredients.value,
}));

const cost = computed(() => hpp(draft.value));
const margin = computed(() => menuMargin(draft.value));
const suggestion = computed(() => suggestPrice(cost.value, targetMargin.value, ROUNDING_STEPS[0]));
const needCheck = computed(() => ingredients.value.filter((item) => item.needsCheck).length);
const manualMissing = computed(() => ingredients.value.filter((item) => !item.commodityId && !item.manualPricePerKg).length);

const canParse = computed(() => name.value.trim().length > 0 && recipeText.value.trim().length > 0);
const canSave = computed(() => ingredients.value.length > 0 && manualMissing.value === 0 && sellPrice.value > 0);

const useSample = () => {
  name.value = name.value || "Nasi Ayam Kecap";
  recipeText.value = SAMPLE_RECIPE;
};

const parse = () => {
  parsing.value = true;
  setTimeout(() => {
    ingredients.value = parseRecipeText(recipeText.value);
    const base = hpp({ ...draft.value, ingredients: ingredients.value });
    sellPrice.value = suggestPrice(base, targetMargin.value, ROUNDING_STEPS[0]).rounded;
    parsing.value = false;
    step.value = 2;
  }, PARSE_DELAY_MS);
};

const addRow = () => {
  ingredients.value.push({
    id: uid("ing"),
    name: "",
    emoji: "🥣",
    qty: 1,
    unit: Unit.Gram,
    commodityId: null,
    manualPricePerKg: null,
    needsCheck: true,
  });
};

const removeRow = (id: string) => {
  ingredients.value = ingredients.value.filter((item) => item.id !== id);
};

const confirmRow = (item: Ingredient) => {
  item.needsCheck = false;
};

const save = () => {
  const id = uid("menu");
  store.addMenu({
    ...draft.value,
    id,
    ingredients: ingredients.value.map((item) => ({ ...item, needsCheck: false })),
  });
  store.showToast("Menu tersimpan");
  router.replace(`/menu/${id}`);
};
</script>

<template>
  <div class="stack">
    <PageHead title="Tambah Menu" back="/menu" :subtitle="`Langkah ${step} dari 3`" />
    <div class="progress"><span :style="{ width: `${(step / 3) * 100}%`, background: 'var(--green-700)' }" /></div>

    <template v-if="step === 1">
      <section class="card stack">
        <h2>1. Tulis nama dan resepnya</h2>
        <div class="field">
          <label for="name">Nama menu</label>
          <input id="name" v-model="name" class="input" placeholder="Contoh: Nasi Ayam Kecap" />
        </div>
        <div class="field">
          <label>Pilih gambar</label>
          <div class="chips">
            <button v-for="item in emojis" :key="item" class="chip" :class="{ active: emoji === item }" @click="emoji = item">{{ item }}</button>
          </div>
        </div>
        <div class="field">
          <label for="recipe">Resep untuk 1 porsi</label>
          <textarea id="recipe" v-model="recipeText" class="textarea" placeholder="150 gram daging ayam&#10;3 siung bawang putih&#10;2 butir telur" />
          <p class="hint">Tulis satu bahan per baris: jumlah, satuan, nama bahan. Boleh pakai ons, siung, butir, sdm.</p>
        </div>
        <button class="btn btn-soft btn-block" @click="useSample">✨ Isi dengan contoh resep</button>
        <button class="btn btn-green btn-block" :disabled="!canParse || parsing" @click="parse">
          {{ parsing ? "Membaca resep..." : "Baca resep saya" }}
        </button>
        <p class="tiny muted">Pembacaan resep memakai contoh sederhana di versi ini. Nantinya dibantu AI, dan Anda tetap harus mengecek hasilnya.</p>
      </section>
    </template>

    <template v-else-if="step === 2">
      <section class="card stack">
        <h2>2. Cek bahan-bahannya</h2>
        <div class="help-box">
          Periksa tiap kartu. Ubah jumlah atau satuan kalau salah.
          <b v-if="needCheck"> {{ needCheck }} bahan perlu dicek.</b>
          Bahan tanpa label "harga pasar" harus Anda isi harganya sendiri.
        </div>
      </section>

      <section v-for="item in ingredients" :key="item.id" class="card stack ing" :class="{ warn: item.needsCheck }">
        <div class="row">
          <div class="avatar">{{ item.emoji }}</div>
          <input v-model="item.name" class="input grow" placeholder="Nama bahan" aria-label="Nama bahan" />
        </div>
        <div class="row">
          <input v-model.number="item.qty" type="number" min="0" step="any" inputmode="decimal" class="input qty" aria-label="Jumlah" />
          <select v-model="item.unit" class="select grow" aria-label="Satuan">
            <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ UNIT_LABELS[unit] }}</option>
          </select>
        </div>
        <div v-if="item.commodityId" class="row">
          <span class="badge badge-source">✔ Harga pasar otomatis</span>
        </div>
        <div v-else class="field">
          <label>Harga Anda per kg (atau liter)</label>
          <input v-model.number="item.manualPricePerKg" type="number" min="0" inputmode="numeric" class="input" placeholder="Contoh: 20000" />
          <span v-if="!item.manualPricePerKg" class="badge badge-manual">Isi harga agar bisa dihitung</span>
        </div>
        <div class="row between">
          <button v-if="item.needsCheck" class="btn btn-soft btn-sm" @click="confirmRow(item)">✔ Sudah benar</button>
          <span v-else class="small muted">✔ Sudah dicek</span>
          <button class="btn btn-danger btn-sm" @click="removeRow(item.id)">Hapus</button>
        </div>
      </section>

      <button class="btn btn-ghost btn-block" @click="addRow">+ Tambah bahan</button>

      <section class="card stack">
        <div class="field">
          <label for="extra">Biaya lain per porsi (gas, kemasan)</label>
          <input id="extra" v-model.number="extraCost" type="number" min="0" inputmode="numeric" class="input" />
        </div>
        <div class="row between total">
          <span>Modal per porsi</span>
          <strong>{{ rupiah(cost) }}</strong>
        </div>
      </section>

      <div class="grid-2">
        <button class="btn btn-ghost" @click="step = 1">Kembali</button>
        <button class="btn btn-green" :disabled="!ingredients.length || manualMissing > 0" @click="step = 3">Lanjut</button>
      </div>
    </template>

    <template v-else>
      <section class="card stack">
        <h2>3. Tentukan harga jual</h2>
        <div class="suggest">
          <p class="small muted">Modal per porsi</p>
          <div class="big-number">{{ rupiah(cost) }}</div>
        </div>
        <div class="field">
          <label for="target">Untung yang diinginkan: <b>{{ percent(targetMargin, 0) }}</b></label>
          <input id="target" v-model.number="targetMargin" type="range" min="0.05" max="0.6" step="0.01" class="range" />
        </div>
        <div class="help-box">
          Saran harga jual: <b>{{ rupiah(suggestion.rounded) }}</b> (untung {{ percent(suggestion.actualMargin, 1) }})
          <button class="btn btn-soft btn-sm btn-block use" @click="sellPrice = suggestion.rounded">Pakai saran ini</button>
        </div>
        <div class="field">
          <label for="price">Harga jual Anda</label>
          <input id="price" v-model.number="sellPrice" type="number" min="0" inputmode="numeric" class="input" />
        </div>
        <div class="row between total">
          <span>Untung per porsi</span>
          <span class="row"><strong>{{ rupiah(sellPrice - cost) }} ({{ percent(margin, 0) }})</strong><StatusBadge :status="statusOf(draft)" /></span>
        </div>
      </section>
      <div class="grid-2">
        <button class="btn btn-ghost" @click="step = 2">Kembali</button>
        <button class="btn btn-green" :disabled="!canSave" @click="save">Simpan menu</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ing.warn {
  border: 3px solid var(--amber);
}
.qty {
  width: 120px;
  flex: none;
}
.total {
  background: var(--green-50);
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 17px;
  flex-wrap: wrap;
}
.suggest {
  background: linear-gradient(140deg, #fff 0%, #fff9c9 100%);
  border-radius: 18px;
  padding: 16px;
  border: 2px solid var(--yellow);
}
.range {
  width: 100%;
  height: 36px;
  accent-color: var(--green-700);
}
.use {
  margin-top: 10px;
}
</style>
