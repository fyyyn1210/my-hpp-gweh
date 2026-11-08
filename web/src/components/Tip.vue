<script setup lang="ts">
import { AnimatePresence, motion } from "motion-v";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { FORMULAS, type Formula } from "@/lib/constants";
import { clamp } from "@/lib/format";

const props = defineProps<{ kind: Formula; calc?: string }>();

const TIP_WIDTH = 280;
const GUTTER = 16;

const tip = computed(() => FORMULAS[props.kind]);
const open = ref(false);
const anchor = ref<HTMLElement | null>(null);
const style = ref<Record<string, string>>({});
let pointer = "";

const place = () => {
  const box = anchor.value!.getBoundingClientRect();
  const width = Math.min(TIP_WIDTH, innerWidth - GUTTER * 2);
  const left = clamp(box.left + box.width / 2 - width / 2, GUTTER, innerWidth - GUTTER - width);
  const above = box.top > innerHeight / 2;
  style.value = { left: `${left}px`, width: `${width}px`, [above ? "bottom" : "top"]: `${above ? innerHeight - box.top + 8 : box.bottom + 8}px` };
};

const show = () => {
  place();
  open.value = true;
};
const hide = () => (open.value = false);
const toggle = () => (open.value ? hide() : show());

const tap = () => (pointer === "mouse" ? show() : toggle());
const hover = (event: PointerEvent, entering: boolean) => {
  if (event.pointerType !== "mouse") return;
  if (entering) show();
  else hide();
};

const outside = (event: Event) => {
  if (!anchor.value?.contains(event.target as Node)) hide();
};
const escape = (event: KeyboardEvent) => event.key === "Escape" && hide();

const listen = (on: boolean) => {
  const method = on ? addEventListener : removeEventListener;
  method("pointerdown", outside, true);
  method("scroll", hide, true);
  method("resize", hide);
  method("keydown", escape);
};
watch(open, listen);
onBeforeUnmount(() => listen(false));
</script>

<template>
  <span
    ref="anchor"
    role="button"
    tabindex="0"
    class="cursor-help underline decoration-dotted decoration-[1.5px] underline-offset-[0.2em]"
    :aria-expanded="open"
    :aria-label="`${tip.title}, penjelasan`"
    @pointerdown="pointer = $event.pointerType"
    @pointerenter="hover($event, true)"
    @pointerleave="hover($event, false)"
    @click.stop.prevent="tap"
    @keydown.enter.stop.prevent="toggle"
    @keydown.space.stop.prevent="toggle"
  ><slot /></span>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        role="tooltip"
        class="fixed z-50 flex flex-col gap-1.5 rounded-[18px] bg-ink p-3.5 text-left text-[15px] leading-snug font-normal tracking-normal text-white shadow-lift"
        :style="style"
        :initial="{ opacity: 0, y: 4 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0 }"
      >
        <p class="font-semibold text-lime">{{ tip.title }}</p>
        <p class="text-white/85">{{ tip.text }}</p>
        <p class="rounded-xl bg-white/10 px-2.5 py-1.5 text-small">{{ tip.formula }}</p>
        <p v-if="calc" class="num text-tiny text-white/70">{{ calc }}</p>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
