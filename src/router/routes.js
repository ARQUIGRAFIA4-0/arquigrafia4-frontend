export default [
  {
    path: "/",
    name: "explore",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/About.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Auth/Login.vue"),
  },
  //   {
  //     path: "/explore",
  //     name: "explore",
  //     component: () => import("../views/Explore.vue"),
  //   },
  {
    path: "/contribua",
    name: "contribua",
    component: () => import("../views/Contribua.vue"),
  },
];
