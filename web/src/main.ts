import { createApp } from "vue";
import Lenis from "lenis";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import { useStore } from "./lib/store";
import "./style.css";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("./views/HomeView.vue") },
    { path: "/mulai", name: "onboarding", component: () => import("./views/OnboardingView.vue"), meta: { bare: true, guest: true } },
    { path: "/masuk", name: "login", component: () => import("./views/AuthView.vue"), meta: { bare: true, guest: true } },
    { path: "/daftar", name: "register", component: () => import("./views/AuthView.vue"), meta: { bare: true, guest: true } },
    { path: "/menu", name: "menus", component: () => import("./views/MenusView.vue") },
    { path: "/menu/baru", name: "menu-new", component: () => import("./views/MenuNewView.vue") },
    { path: "/menu/:id", name: "menu-detail", component: () => import("./views/MenuDetailView.vue"), props: true },
    { path: "/tanya", name: "assistant", component: () => import("./views/AssistantView.vue") },
    { path: "/nota", name: "nota", component: () => import("./views/NotaView.vue") },
    { path: "/harga", name: "prices", component: () => import("./views/PricesView.vue") },
    { path: "/alarm", name: "alarms", component: () => import("./views/AlarmsView.vue") },
    { path: "/pengaturan", name: "settings", component: () => import("./views/SettingsView.vue") },
    { path: "/:rest(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const { state, loaded, load, report } = useStore();
  if (state.session && !loaded.value) await load().catch(report);
  if (!state.session && !to.meta.guest) return { name: state.onboardingDone ? "login" : "onboarding" };
  if (state.session && to.meta.guest) return { name: "home" };
  return true;
});

const lenis = matchMedia("(prefers-reduced-motion: reduce)").matches ? null : new Lenis({ autoRaf: true });

router.afterEach(() => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)));

createApp(App).use(router).mount("#app");
