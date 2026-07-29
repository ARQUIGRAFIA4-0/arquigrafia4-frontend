import routes from "./routes";
import { useAuthStore } from "@/store/auth";
import { createRouter, createWebHistory } from "vue-router";

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
  scrollBehavior(to, from, savedPosition) {
    // Desabilita restauração de scroll no mosaico
    const isMosaicRoute = to.name === 'explore' && to.params.viewMode === 'mosaic';
    if (isMosaicRoute) {
      return { top: 0, behavior: 'instant' };
    }

    // Ao chegar numa imagem de detalhe, sobe-se ao topo instantaneamente.
    const isImageDetail =
      typeof to.name === "string" && to.name.startsWith("image-detail");
    if (isImageDetail) {
      return { top: 0, behavior: 'instant' };
    }

    // Se o usuário estiver usando os botões "voltar/avançar" do navegador,
    // mantém a posição de scroll salva.
    if (savedPosition) {
      return savedPosition;
    }

    // Para todas as outras navegações, vai para o topo da página.
    return { top: 0, behavior: 'smooth' };
  },
});

router.beforeEach((to, from, next) => {
  // Normaliza trailing slashes (exceto raiz "/")
  if (to.path !== '/' && to.path.endsWith('/')) {
    return next({
      path: to.path.slice(0, -1),
      query: to.query,
      hash: to.hash,
      replace: true
    });
  }

  // Verifica autenticação para rotas protegidas
  const store = useAuthStore();
  if (to.meta.requiresAuth && !store.isLoggedIn) {
    return next("/login");
  }

  next();
});

export default router;
