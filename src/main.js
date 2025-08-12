import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const pinia = createPinia();
import "./scss/styles.scss";
import "bootstrap-icons/font/bootstrap-icons.css";
import router from "./router/index";

import { Popover } from "bootstrap";

createApp(App).use(pinia).use(router).mount("#app");
