<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "@/lib/store";

const route = useRoute();
const { unreadCount, toast } = useStore();

const bare = computed(() => Boolean(route.meta.bare));

const tabs = [
  { to: "/", icon: "🏠", label: "Beranda" },
  { to: "/menu", icon: "🍽️", label: "Menu" },
  { to: "/harga", icon: "📈", label: "Harga" },
  { to: "/alarm", icon: "🔔", label: "Alarm" },
  { to: "/pengaturan", icon: "⚙️", label: "Atur" },
];

const isActive = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
</script>

<template>
  <div class="shell" :class="{ bare }">
    <aside v-if="!bare" class="side">
      <div class="brand">🍲 HPP Pintar</div>
      <nav>
        <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="side-link" :class="{ on: isActive(tab.to) }">
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <b v-if="tab.to === '/alarm' && unreadCount" class="dot">{{ unreadCount }}</b>
        </RouterLink>
      </nav>
      <p class="tiny muted side-note">Data di aplikasi ini masih contoh, belum terhubung ke harga pasar asli.</p>
    </aside>

    <main class="main">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>

    <nav v-if="!bare" class="tabbar" aria-label="Menu utama">
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab" :class="{ on: isActive(tab.to) }">
        <span class="tab-icon">{{ tab.icon }}<b v-if="tab.to === '/alarm' && unreadCount" class="dot">{{ unreadCount }}</b></span>
        <span class="tab-label">{{ tab.label }}</span>
      </RouterLink>
    </nav>

    <Transition name="fade">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
}
.side {
  display: none;
}
.main {
  width: 100%;
  max-width: 560px;
  padding: 18px 16px 120px;
}
.bare .main {
  padding-bottom: 32px;
}
.tabbar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 12px;
  width: calc(100% - 24px);
  max-width: 540px;
  background: #fff;
  border-radius: 26px;
  box-shadow: 0 8px 28px rgba(20, 60, 20, 0.2);
  display: flex;
  padding: 6px;
  z-index: 20;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
  border-radius: 20px;
  min-height: 60px;
  color: var(--muted);
}
.tab.on {
  background: var(--green-100);
  color: var(--green-900);
}
.tab-icon {
  font-size: 22px;
  position: relative;
  line-height: 1.2;
}
.tab-label {
  font-size: 12.5px;
  font-weight: 700;
}
.dot {
  background: var(--red);
  color: #fff;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-grid;
  place-items: center;
  padding: 0 5px;
}
.tab-icon .dot {
  position: absolute;
  top: -4px;
  right: -12px;
}
.toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 100px;
  background: var(--ink);
  color: #fff;
  padding: 14px 20px;
  border-radius: 16px;
  font-weight: 700;
  z-index: 40;
  max-width: calc(100% - 32px);
  text-align: center;
}

@media (min-width: 900px) {
  .shell {
    gap: 28px;
    padding: 0 24px;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 250px;
    padding: 28px 0;
    position: sticky;
    top: 0;
    height: 100vh;
    flex: none;
  }
  .brand {
    font-size: 22px;
    font-weight: 800;
  }
  .side nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .side-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 18px;
    font-weight: 700;
    font-size: 17px;
  }
  .side-link.on {
    background: #fff;
    box-shadow: var(--shadow);
  }
  .side-link .dot {
    margin-left: auto;
  }
  .side-note {
    margin-top: auto;
  }
  .main {
    max-width: 760px;
    padding: 28px 0 60px;
  }
  .tabbar {
    display: none;
  }
  .toast {
    bottom: 32px;
  }
}
</style>
