import {
  DEFAULT_VIEW_ROUTE,
  resolveViewOptionByRoute,
} from "@/constants/viewModes";
import { useImageUploadStore } from "@/store/imageUploads";

const redirectToDefaultView = (to) => ({
  name: "explore",
  params: {
    ...to.params,
    viewMode: DEFAULT_VIEW_ROUTE,
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
    path: "/explore/sugestoes/image/:id",
    name: "image-detail-sugestoes",
    component: () => import("../views/ImageDetail.vue"),
    meta: { section: "sugestoes" },
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
  // Detalhe canônico de coleção — rota pública, dono polimórfico (usuário ou coletivo).
  // Autorização é data-driven: dono resolvido pelos dados do álbum; privacidade via 403
  // do backend. Coleções de usuário também são acessíveis aqui (quem tem direito vê).
  {
    path: "/colecoes/:collectionId",
    name: "collection-detail-redirect",
    redirect: (to) => ({
      name: "collection-detail",
      params: { collectionId: to.params.collectionId, viewMode: "grid" },
    }),
  },
  // Edição canônica de coleção (usuário ou coletivo). O backend autoriza:
  // dono do álbum de usuário ou qualquer membro do coletivo. Declarada antes
  // da rota :viewMode para que o segmento estático "edit" não seja tratado
  // como um modo de visualização.
  {
    path: "/colecoes/:collectionId/edit",
    name: "collection-edit",
    component: () => import("../views/CollectionEdit.vue"),
    meta: { requiresAuth: true, showFooter: false },
  },
  {
    path: "/colecoes/:collectionId/:viewMode",
    name: "collection-detail",
    component: () => import("../views/CollectionDetail.vue"),
    beforeEnter: (to) => {
      const allowed = ["grid", "mosaic", "map"];
      if (!allowed.includes(to.params.viewMode)) {
        return {
          name: "collection-detail",
          params: { ...to.params, viewMode: "grid" },
          replace: true,
        };
      }
      return true;
    },
  },
  {
    path: "/obras/:id",
    name: "work-detail",
    component: () => import("../views/WorkDetail.vue"),
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
    meta: { requiresAuth: true },
    // Sem imagens pendentes (ex.: refresh nesta rota), o estado em memória é
    // perdido e a tela fica inutilizável. Reinicia o fluxo em /colabore.
    beforeEnter: () => {
      const uploadStore = useImageUploadStore();
      if (uploadStore.pendingImages.length === 0) {
        return {
          name: "colabore",
          state: {
            uploadReset:
              "O processo de upload foi reiniciado, selecione as imagens novamente.",
          },
        };
      }
      return true;
    },
  },
  {
    path: "/eu/editar",
    name: "edit-my-profile",
    component: () => import("../views/Profile/EditProfile.vue"),
    meta: { requiresAuth: true }
  },
  // Rotas legadas /eu/colecoes/* — redirecionam para as rotas canônicas de coleção.
  // Mantidas temporariamente para preservar links/bookmarks antigos; a rota /eu/colecoes
  // (listagem, aba do perfil) permanece ativa. A rota /edit vem antes da rota :viewMode
  // para o segmento estático "edit" não ser interpretado como modo de visualização.
  {
    path: "/eu/colecoes/:collectionId/edit",
    redirect: (to) => ({
      name: "collection-edit",
      params: { collectionId: to.params.collectionId },
      query: to.query,
      hash: to.hash,
    }),
  },
  {
    path: "/eu/colecoes/:collectionId/:viewMode",
    redirect: (to) => ({
      name: "collection-detail",
      params: {
        collectionId: to.params.collectionId,
        viewMode: to.params.viewMode,
      },
      query: to.query,
      hash: to.hash,
    }),
  },
  {
    path: "/eu/colecoes/:collectionId",
    redirect: (to) => ({
      name: "collection-detail",
      params: { collectionId: to.params.collectionId, viewMode: "grid" },
      query: to.query,
      hash: to.hash,
    }),
  },
  {
    path: "/profile",
    redirect: "/perfil",
  },
  {
    path: "/perfil/:id",
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
