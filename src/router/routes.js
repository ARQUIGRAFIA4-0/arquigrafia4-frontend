export default [
  {
    path: "/",
    name: "explore",
    component: () => import("../views/HomePage.vue"),
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
    path: "/eu",
    name: "my-profile",
    component: () => import("../views/Profile/ViewPrivateProfile.vue"),
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
