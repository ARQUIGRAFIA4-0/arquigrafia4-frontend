import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";

const pinia = createPinia();
import "./scss/styles.scss";
import "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import router from "./router/index";

const queryClient = new QueryClient();

createApp(App)
  .use(pinia)
  .use(router)
  .use(VueQueryPlugin, { queryClient })
  .mount("#app");
