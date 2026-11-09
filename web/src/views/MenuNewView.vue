<script setup lang="ts">
import FoodIcon from "@/components/FoodIcon.vue";
import Tip from "@/components/Tip.vue";
import { AnimatePresence, motion } from "motion-v";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import PageHead from "@/components/PageHead.vue";
import SourceTag from "@/components/SourceTag.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { hpp, ingredientPriceInfo, marginSteps, menuMargin, SAMPLE_RECIPE, statusOf, suggestPrice } from "@/lib/engine";
import { Food, Formula, MARGIN_CHOICES, MENU_ICONS, TODAY, UNIT_LABELS } from "@/lib/constants";
import { percent, rupiah, thousands, uid } from "@/lib/format";
import { Unit, type Ingredient, type Menu } from "@/lib/types";

const router = useRouter();
const route = useRoute();
const store = useStore();

const step = ref<1 | 2 | 3>(1);
const name = ref(typeof route.query.nama === "string" ? route.query.nama : "");
const icon = ref(Food.Dish);
const recipeText = ref(typeof route.query.resep === "string" ? route.query.resep : "");
const parsing = ref(false);
const ingredients = ref<Ingredient[]>([]);
const askedPrice = Number(route.query.harga) || 0;
const sellPrice = ref(askedPrice || 15000);
const targetMargin = ref(0.3);
const extraCost = ref(1000);

const unitOptions = Object.values(Unit);
const titles = ["Nama dan resep", "Cek bahan", "Harga jual"];

const draft = computed<Menu>(() => ({
  id: "draft",
  name: name.value || "Menu baru",
  icon: icon.value,
  sellPrice: sellPrice.value,
  priceSetDay: TODAY,
  targetMargin: targetMargin.value,
  threshold: 0.2,
  extraCost: extraCost.value,
  ingredients: ingredients.value,
}));

const cost = computed(() => hpp(draft.value));
const margin = computed(() => menuMargin(draft.value));
const suggestion = computed(() => suggestPrice(cost.value, targetMargin.value, store.state.roundingStep));
const needCheck = computed(() => ingredients.value.filter((item) => item.needsCheck).length);
const manualMissing = computed(() => ingredients.value.filter((item) => !item.commodityId && !item.manualPricePerKg).length);

const blocker = computed<{ target: string; text: string } | null>(() => {
  if (step.value === 1) {
    if (!name.value.trim()) return { target: "name", text: "Isi nama menu dulu." };
    if (!recipeText.value.trim()) return { target: "recipe", text: "Tulis resepnya dulu, satu bahan per baris." };
    return null;
  }
  if (!ingredients.value.length) return { target: "add-ingredient", text: "Tambah minimal 1 bahan." };
  const unnamed = ingredients.value.find((item) => !item.name.trim());
  if (unnamed) return { target: `name-${unnamed.id}`, text: "Ada bahan yang belum diberi nama." };
  const noQty = ingredients.value.find((item) => !(item.qty > 0));
  if (noQty) return { target: `qty-${noQty.id}`, text: `Isi jumlah ${noQty.name} dulu.` };
  const noPrice = ingredients.value.find((item) => !item.commodityId && !item.manualPricePerKg);
  if (noPrice) {
    const more = manualMissing.value > 1 ? ` (${manualMissing.value} bahan belum ada harganya)` : "";
    return { target: `price-${noPrice.id}`, text: `Isi harga ${noPrice.name} per kg dulu${more}.` };
  }
  if (step.value === 3 && !(sellPrice.value > 0)) return { target: "price", text: "Isi harga jual dulu." };
  return null;
});

const showBlocker = () => {
  const field = blocker.value && document.getElementById(blocker.value.target);
  if (!field) return;
  field.scrollIntoView({ behavior: "smooth", block: "center" });
  field.focus({ preventScroll: true });
};

const guarded = (action: () => void) => () => (blocker.value ? showBlocker() : action());

const useSample = () => {
  name.value = name.value || "Nasi Ayam Kecap";
  recipeText.value = SAMPLE_RECIPE;
};

const parse = async () => {
  parsing.value = true;
  try {
    const parsed = await api<Array<Omit<Ingredient, "id">>>("/recipes/parse", "POST", { text: recipeText.value });
    ingredients.value = parsed.map((item) => ({ ...item, id: uid("ing") }));
    step.value = 2;
  } catch (error) {
    store.report(error);
  } finally {
    parsing.value = false;
  }
};

const toPrice = () => {
  sellPrice.value = askedPrice || suggestion.value.rounded;
  step.value = 3;
};

const addRow = () => {
  ingredients.value.push({
    id: uid("ing"),
    name: "",
    icon: Food.Ingredient,
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

const saving = ref(false);

const save = async () => {
  saving.value = true;
  try {
    const id = await store.addMenu({ ...draft.value, name: name.value.trim() || draft.value.name });
    store.showToast("Menu tersimpan");
    router.replace(`/menu/${id}`);
  } catch (error) {
    store.report(error);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col gap-5.5">
    <PageHead title="Tambah menu" back="/menu" :subtitle="`Langkah ${step} dari 3: ${titles[step - 1]}`" />
    <div class="-mt-2 flex gap-1.5">
      <span v-for="i in 3" :key="i" class="h-[5px] flex-1 rounded-full transition-colors" :class="i <= step ? 'bg-ink' : 'bg-ink/12'" />
    </div>

    <AnimatePresence mode="wait">
      <motion.div v-if="step === 1" key="s1" class="flex flex-col gap-5.5" :initial="{ opacity: 0, x: 24 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -24 }">
        <section class="card flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="name" class="label">Nama menu</label>
            <input id="name" v-model="name" class="input" placeholder="Contoh: Nasi Ayam Kecap" />
          </div>
          <div class="flex flex-col gap-2">
            <span class="label">Pilih gambar</span>
            <div class="chips">
              <button v-for="item in MENU_ICONS" :key="item" class="chip px-3.5" :class="{ active: icon === item }" :aria-label="item" @click="icon = item"><FoodIcon :name="item" :size="24" /></button>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label for="recipe" class="label">Resep untuk 1 porsi</label>
            <textarea id="recipe" v-model="recipeText" class="textarea" placeholder="150 gram daging ayam&#10;3 siung bawang putih&#10;2 butir telur" />
            <p class="text-sm text-ink-2">Satu bahan per baris: jumlah, satuan, nama. Boleh pakai ons, siung, butir, sdm.</p>
          </div>
          <button class="btn btn-light w-full" @click="useSample"><Icon name="sparkles" :size="20" />Isi dengan contoh resep</button>
        </section>
        <button class="btn w-full" :disabled="parsing" :aria-disabled="!!blocker" @click="guarded(parse)()">
          {{ parsing ? "Membaca resep..." : "Baca resep saya" }}<Icon v-if="!parsing" name="next" :size="20" />
        </button>
        <p v-if="blocker" class="flex items-center gap-2 text-small font-semibold text-warn" role="status"><Icon name="info" :size="18" class="flex-none" />{{ blocker.text }}</p>
        <p class="text-center text-tiny text-ink-2">Versi ini memakai pembaca resep sederhana. Nantinya dibantu AI, dan Anda tetap mengecek hasilnya.</p>
      </motion.div>

      <motion.div v-else-if="step === 2" key="s2" class="flex flex-col gap-5.5" :initial="{ opacity: 0, x: 24 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -24 }">
        <div class="note">
          <Icon name="info" :size="20" class="mt-px flex-none" />
          <p>
            Periksa tiap bahan. Ubah jumlah atau satuan kalau salah.
            <b v-if="needCheck">{{ needCheck }} bahan perlu dicek.</b>
            Bahan tanpa harga pasar perlu Anda isi harganya.
          </p>
        </div>

        <section v-for="item in ingredients" :key="item.id" class="card flex flex-col gap-3.5" :class="item.needsCheck && 'ring-2 ring-warn-bar'">
          <div class="flex items-center gap-3">
            <span class="avatar avatar-sm"><FoodIcon :name="item.icon" :size="22" /></span>
            <input :id="`name-${item.id}`" v-model="item.name" class="input min-w-0 flex-1" placeholder="Nama bahan" aria-label="Nama bahan" />
            <button class="icon-btn-flat" aria-label="Hapus bahan" @click="removeRow(item.id)"><Icon name="trash" :size="19" /></button>
          </div>
          <div class="flex items-center gap-3">
            <input :id="`qty-${item.id}`" v-model.number="item.qty" type="number" min="0" step="any" inputmode="decimal" class="input num w-24 flex-none px-2 text-center" aria-label="Jumlah" />
            <select v-model="item.unit" class="input min-w-0 flex-1" aria-label="Satuan">
              <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ UNIT_LABELS[unit] }}</option>
            </select>
          </div>
          <div v-if="item.commodityId" class="flex items-center justify-between gap-3">
            <span class="num text-tiny text-ink-2">{{ rupiah(ingredientPriceInfo(item).price) }}/kg</span>
            <SourceTag :source="ingredientPriceInfo(item).source" :day="ingredientPriceInfo(item).day" />
          </div>
          <div v-else class="flex flex-col gap-2">
            <label class="label">Harga per kg (atau liter)</label>
            <div class="input-money min-h-14 [&>input]:min-h-[52px] [&>input]:text-xl">
              <span>Rp</span>
              <input :id="`price-${item.id}`" v-model.number="item.manualPricePerKg" type="number" min="0" inputmode="numeric" placeholder="0" />
            </div>
          </div>
          <button v-if="item.needsCheck" class="btn btn-sm btn-light" @click="item.needsCheck = false"><Icon name="check" :size="18" />Sudah benar</button>
        </section>

        <button id="add-ingredient" class="btn btn-outline w-full" @click="addRow"><Icon name="plus" :size="20" />Tambah bahan</button>

        <section class="card flex flex-col gap-3.5">
          <div class="flex flex-col gap-2">
            <label for="extra" class="label">Biaya lain per porsi (gas, kemasan)</label>
            <div class="input-money min-h-14 [&>input]:min-h-[52px] [&>input]:text-xl">
              <span>Rp</span>
              <input id="extra" v-model.number="extraCost" type="number" min="0" inputmode="numeric" />
            </div>
          </div>
          <div class="flex items-center justify-between rounded-field bg-mist px-4 py-3.5 text-[17px]">
            <span>Modal per porsi</span>
            <strong class="num">{{ rupiah(cost) }}</strong>
          </div>
        </section>

        <div class="grid grid-cols-2 gap-3">
          <button class="btn btn-white" @click="step = 1">Kembali</button>
          <button class="btn" :aria-disabled="!!blocker" @click="guarded(toPrice)()">Lanjut</button>
        </div>
        <p v-if="blocker" class="flex items-center gap-2 text-small font-semibold text-warn" role="status"><Icon name="info" :size="18" class="flex-none" />{{ blocker.text }}</p>
      </motion.div>

      <motion.div v-else key="s3" class="flex flex-col gap-5.5" :initial="{ opacity: 0, x: 24 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -24 }">
        <section class="card-lime flex flex-col gap-2">
          <p class="text-small">Modal per porsi</p>
          <p class="big-number"><span class="cur">Rp</span>{{ thousands(cost) }}</p>
        </section>
        <section class="card flex flex-col gap-3.5">
          <span class="label">Mau untung berapa?</span>
          <div class="chips">
            <button v-for="value in MARGIN_CHOICES" :key="value" class="chip" :class="{ active: targetMargin === value }" @click="targetMargin = value">{{ percent(value, 0) }}</button>
          </div>
          <div class="note">
            <Icon name="tag" :size="20" class="mt-px flex-none" />
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <p>Saran harga jual <b class="num">{{ rupiah(suggestion.rounded) }}</b> (untung <Tip :kind="Formula.MarginNew" :calc="marginSteps(suggestion.rounded, cost)">{{ percent(suggestion.actualMargin, 0) }}</Tip>)</p>
              <button class="btn btn-sm btn-white self-start" @click="sellPrice = suggestion.rounded">Pakai saran ini</button>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label for="price" class="label">Harga jual Anda</label>
            <div class="input-money">
              <span>Rp</span>
              <input id="price" v-model.number="sellPrice" type="number" min="0" inputmode="numeric" />
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-field bg-mist px-4 py-3.5 text-[17px]">
            <span>Untung per porsi <b class="num">{{ rupiah(sellPrice - cost) }} (<Tip :kind="Formula.Margin" :calc="marginSteps(sellPrice, cost)">{{ percent(margin, 0) }}</Tip>)</b></span>
            <StatusBadge :status="statusOf(draft)" />
          </div>
        </section>
        <div class="grid grid-cols-2 gap-3">
          <button class="btn btn-white" @click="step = 2">Kembali</button>
          <button class="btn" :disabled="saving" :aria-disabled="!!blocker" @click="guarded(save)()">{{ saving ? "Menyimpan..." : "Simpan menu" }}</button>
        </div>
        <p v-if="blocker" class="flex items-center gap-2 text-small font-semibold text-warn" role="status"><Icon name="info" :size="18" class="flex-none" />{{ blocker.text }}</p>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
