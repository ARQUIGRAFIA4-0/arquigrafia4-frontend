import {
  DEFAULT_VIEW_ROUTE,
  resolveViewOptionByRoute,
} from "@/constants/viewModes";

const redirectToDefaultView = (to) => ({
  name: "explore",
  params: {
    ...to.params,
    viewMode: DEFAULT_VIEW_ROUTE,
  },
  query: to.query,
  hash: to.hash,
});

const redirectToDefaultCollectionView = (to) => ({
  name: "my-collection-detail",
  params: {
    collectionId: to.params.collectionId,
    viewMode: "grid",
  },
  query: to.query,
  hash: to.hash,
});

export default [
  {
    path: "/",
    redirect: redirectToDefaultView,
  },
  {
    path: "/explore",
    redirect: redirectToDefaultView,
  },
  {
    path: "/explore/acervo",
    redirect: redirectToDefaultView,
  },
  {
    path: "/explore/acervo/:viewMode",
    name: "explore",
    component: () => import("../views/HomePage.vue"),
    beforeEnter: (to) => {
      const option = resolveViewOptionByRoute(to.params.viewMode);
      if (option.route !== to.params.viewMode) {
        return redirectToDefaultView({
          ...to,
          params: { ...to.params, viewMode: option.route },
        });
      }
      return true;
    },
  },
  {
    path: "/explore/dados/image/:id",
    name: "image-detail-dados",
    component: () => import("../views/ImageDetail.vue"),
    meta: { section: "dados" },
  },
  {
    path: "/explore/comentarios/image/:id",
    name: "image-detail-comentarios",
    component: () => import("../views/ImageDetail.vue"),
    meta: { section: "comentarios" },
  },
  {
    path: "/explore/interpretacoes/image/:id",
    name: "image-detail-interpretacoes",
    component: () => import("../views/ImageDetail.vue"),
    meta: { section: "interpretacoes" },
  },
  {
    path: "/explore/relacionadas/image/:id",
    name: "image-detail-relacionadas",
    component: () => import("../views/ImageDetail.vue"),
    meta: { section: "relacionadas" },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Auth/AuthLogin.vue"),
  },
  {
    path: "/colabore",
    name: "colabore",
    component: () => import("../views/Collaborate.vue"),
  },
  // Lab routes
  {
    path: "/explore/lab",
    name: "lab-list",
    component: () => import("../views/LabView.vue"),
  },
  {
    path: "/explore/lab/:slug",
    name: "lab-detail",
    component: () => import("../views/LabView.vue"),
    beforeEnter: async (to) => {
      const { projectExists } = await import("@/data/labProjects.js");
      if (!projectExists(to.params.slug)) {
        return { name: "lab-list" };
      }
      return true;
    },
  },
  // Rota de redes
  {
    path: "/explore/rede",
    name: "rede",
    component: () => import("../views/NetworkPage.vue")
  },
  // About routes
  {
    path: "/about",
    redirect: "/about/project",
  },
  {
    path: "/about/project",
    name: "about-project",
    component: () => import("../views/About/AboutProject.vue"),
  },
  {
    path: "/about/members",
    name: "about-members",
    component: () => import("../views/About/AboutMembers.vue"),
  },
  {
    path: "/about/policies",
    name: "about-policies",
    component: () => import("../views/About/AboutPolicies.vue"),
  },
  {
    path: "/about/faq",
    name: "about-faq",
    component: () => import("../views/About/AboutFaq.vue"),
  },
  {
    path: "/about/open-source",
    name: "about-open-source",
    component: () => import("../views/About/AboutOpenSource.vue"),
  },
  {
    path: "/about/vocabulary",
    name: "about-vocabulary",
    component: () => import("../views/About/AboutVocabulary.vue"),
  },
  // Collective routes
  {
    path: "/coletivos/criar",
    name: "collective-create",
    component: () => import("../views/Collective/CreateCollective.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/coletivos/:id",
    name: "collective-detail",
    component: () => import("../views/Collective/ViewCollective.vue"),
  },
  {
    path: "/coletivos/:id/editar",
    name: "collective-edit",
    component: () => import("../views/Collective/EditCollective.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/eu",
    redirect: { name: "my-profile-images" },
    meta: { requiresAuth: true }
  },
  {
    path: "/eu/imagens",
    name: "my-profile-images",
    component: () => import("../views/Profile/ViewPrivateProfile.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/eu/colecoes",
    name: "my-profile-collections",
    component: () => import("../views/Profile/ViewPrivateProfile.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/eu/imagens/metadados",
    name: "image-metadata",
    component: () => import("../views/Profile/ImageMetadataUpload.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/eu/editar",
    name: "edit-my-profile",
    component: () => import("../views/Profile/EditProfile.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/eu/colecoes/:collectionId",
    name: "my-collection-detail-redirect",
    redirect: redirectToDefaultCollectionView,
    meta: { requiresAuth: true }
  },
  {
    path: "/eu/colecoes/:collectionId/edit",
    name: "my-collection-edit",
    component: () => import("../views/Profile/CollectionEdit.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/eu/colecoes/:collectionId/:viewMode",
    name: "my-collection-detail",
    component: () => import("../views/Profile/CollectionDetail.vue"),
    beforeEnter: (to) => {
      const allowed = ["grid", "mosaic"];
      const option = resolveViewOptionByRoute(to.params.viewMode);

      if (!allowed.includes(option.route)) {
        return redirectToDefaultCollectionView(to);
      }

      if (option.route !== to.params.viewMode) {
        return {
          name: "my-collection-detail",
          params: {
            collectionId: to.params.collectionId,
            viewMode: option.route,
          },
          query: to.query,
          hash: to.hash,
          replace: true,
        };
      }

      return true;
    },
    meta: { requiresAuth: true }
  },
  {
    path: "/profile",
    redirect: "/",
  },
  {
    path: "/profile/:id",
    name: "view-profile",
    component: () => import("../views/Profile/ViewPublicProfile.vue")
  },
  // Rota "catch-all" para casos 404 (deve ser a última rota definida)
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFound.vue")
  },
];
