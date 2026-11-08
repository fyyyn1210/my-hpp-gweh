import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import { useStore } from "./lib/store";
import "./style.css";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("./views/HomeView.vue") },
    { path: "/mulai", name: "onboarding", component: () => import("./views/OnboardingView.vue"), meta: { bare: true } },
    { path: "/menu", name: "menus", component: () => import("./views/MenusView.vue") },
    { path: "/menu/baru", name: "menu-new", component: () => import("./views/MenuNewView.vue") },
    { path: "/menu/:id", name: "menu-detail", component: () => import("./views/MenuDetailView.vue"), props: true },
    { path: "/harga", name: "prices", component: () => import("./views/PricesView.vue") },
    { path: "/alarm", name: "alarms", component: () => import("./views/AlarmsView.vue") },
    { path: "/pengaturan", name: "settings", component: () => import("./views/SettingsView.vue") },
    { path: "/:rest(.*)*", redirect: "/" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const { state } = useStore();
  if (!state.onboardingDone && to.name !== "onboarding") return { name: "onboarding" };
  return true;
});

createApp(App).use(router).mount("#app");
