<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { AnimatePresence, MotionConfig, motion } from "motion-v";
import Icon, { type IconName } from "@/components/Icon.vue";
import Logo from "@/components/Logo.vue";
import { useStore } from "@/lib/store";

const route = useRoute();
const { unreadCount, toast, state, isDemo } = useStore();

const bare = computed(() => Boolean(route.meta.bare));

const tabs: Array<{ to: string; icon: IconName; label: string }> = [
  { to: "/", icon: "home", label: "Beranda" },
  { to: "/menu", icon: "menu", label: "Menu" },
  { to: "/tanya", icon: "chat", label: "Tanya" },
  { to: "/harga", icon: "chart", label: "Harga" },
  { to: "/alarm", icon: "bell", label: "Peringatan" },
];

const sideLinks: Array<{ to: string; icon: IconName; label: string }> = [
  { to: "/", icon: "home", label: "Beranda" },
  { to: "/menu", icon: "menu", label: "Menu saya" },
  { to: "/tanya", icon: "chat", label: "Tanya" },
  { to: "/nota", icon: "receipt", label: "Catatan harga belanja" },
  { to: "/harga", icon: "chart", label: "Harga bahan" },
  { to: "/alarm", icon: "bell", label: "Peringatan" },
  { to: "/pengaturan", icon: "settings", label: "Pengaturan" },
];

const isActive = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
</script>

<template>
  <MotionConfig reduced-motion="user">
    <div class="flex min-h-screen justify-center lg:gap-10 lg:px-7">
      <aside v-if="!bare" class="sticky top-0 hidden h-screen w-[268px] flex-none flex-col gap-7 py-7 lg:flex">
        <RouterLink to="/" class="flex items-center gap-3 text-[21px] font-semibold tracking-[-0.02em]"><Logo :size="44" />MyHPPGweh</RouterLink>
        <nav class="flex flex-col gap-1">
          <RouterLink
            v-for="link in sideLinks"
            :key="link.to"
            :to="link.to"
            class="flex min-h-[52px] items-center gap-3 rounded-full px-[18px] font-medium transition-colors"
            :class="isActive(link.to) ? 'bg-ink text-white' : 'text-ink-2 hover:bg-white/60'"
          >
            <Icon :name="link.icon" />
            <span class="flex-1">{{ link.label }}</span>
            <b v-if="link.to === '/alarm' && unreadCount" class="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] text-white">{{ unreadCount }}</b>
          </RouterLink>
        </nav>
        <div class="mt-auto rounded-field bg-white/60 px-4 py-3.5">
          <p class="text-small font-semibold">{{ state.ownerName }}</p>
          <p class="text-tiny text-ink-2">{{ state.city }}<template v-if="isDemo"> · akun demo</template></p>
        </div>
      </aside>

      <main class="w-full min-w-0 max-w-[560px] px-4 pt-5 lg:max-w-[720px] lg:px-0 lg:pt-8 lg:pb-16" :class="bare ? 'pb-6' : 'pb-[130px]'">
        <RouterView v-slot="{ Component, route: current }">
          <AnimatePresence mode="wait">
            <motion.div
              :key="current.path"
              :initial="{ opacity: 0, y: 14 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0, y: -6 }"
              :transition="{ duration: 0.22, ease: 'easeOut' }"
            >
              <component :is="Component" />
            </motion.div>
          </AnimatePresence>
        </RouterView>
      </main>

      <nav
        v-if="!bare"
        class="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center drop-shadow-[0_14px_22px_rgba(16,60,34,0.22)] lg:hidden"
        aria-label="Menu utama"
      >
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="relative -mx-[3px] grid size-[62px] place-items-center rounded-full bg-white p-[7px]"
          :aria-label="tab.label"
          :title="tab.label"
        >
          <span class="grid size-full place-items-center rounded-full transition-colors" :class="isActive(tab.to) ? 'bg-ink text-white' : 'text-ink-2'">
            <Icon :name="tab.icon" :size="24" :stroke="isActive(tab.to) ? 2 : 1.6" />
          </span>
          <b
            v-if="tab.to === '/alarm' && unreadCount"
            class="absolute top-1 right-1 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-danger px-[5px] text-[11px] text-white ring-2 ring-white"
          >{{ unreadCount }}</b>
        </RouterLink>
      </nav>

      <AnimatePresence>
        <motion.div
          v-if="toast"
          :initial="{ opacity: 0, y: 16, scale: 0.96 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, y: 10 }"
          class="fixed bottom-[104px] left-0 right-0 z-40 mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-2.5 rounded-full bg-ink px-[22px] py-3.5 font-medium text-white shadow-lift lg:bottom-8"
          role="status"
        >
          <Icon name="check" :size="20" :stroke="2.4" class="flex-none text-lime-2" />{{ toast }}
        </motion.div>
      </AnimatePresence>
    </div>
  </MotionConfig>
</template>
