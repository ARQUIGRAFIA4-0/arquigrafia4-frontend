import routes from "./routes";
import { useAuthStore } from "@/store/auth";
import { createRouter, createWebHistory } from "vue-router";

const protectedRoutes = ["/eu", "/eu/editar"];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../layouts/DefaultLayout.vue"),
      children: routes,
    },
  ],
});

router.beforeEach((to, from, next) => {
  const store = useAuthStore();
  const isLoggedIn = store.isLoggedIn;

  if (protectedRoutes.includes(to.path) && !isLoggedIn) {
    next("/login");
  } else {
    next();
  }
});

export default router;
