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
    path: "/image/:id",
    name: "image-detail",
    component: () => import("../views/ImageDetail.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Auth/AuthLogin.vue"),
  },
  {
    path: "/contribua",
    name: "contribua",
    component: () => import("../views/Contribua.vue"),
  },
  // About routes
  {
    path: "/about/project",
    name: "about-project",
    component: () => import("../views/About/AboutProject.vue"),
  },
  {
    path: "/about/events",
    name: "events",
    component: () => import("../views/About/Events.vue"),
  },
  {
    path: "/about/wiki",
    name: "wiki",
    component: () => import("../views/About/Wiki.vue"),
  },
  // Profile routes
  {
    path: "/profile",
    name: "view-profile",
    component: () => import("../views/Profile/ViewProfile.vue"),
  },
  {
    path: "/profile/edit",
    name: "edit-profile",
    component: () => import("../views/Profile/EditProfile.vue"),
  },
];
