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
  // Profile routes
  {
    path: "/eu",
    name: "my-profile",
    component: () => import("../views/Profile/ViewPrivateProfile.vue"),
  },
  {
    path: "/eu/imagens/metadados",
    name: "image-metadata",
    component: () => import("../views/Profile/ImageMetadataUpload.vue"),
  },
  {
    path: "/eu/editar",
    name: "edit-my-profile",
    component: () => import("../views/Profile/EditProfile.vue"),
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
];
