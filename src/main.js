import { createApp } from "vue";
import MasonryWall from "@yeger/vue-masonry-wall";
import { createPinia } from "pinia";
import App from "./App.vue";

const pinia = createPinia();
import "./scss/styles.scss";
import "bootstrap-icons/font/bootstrap-icons.css";
import router from "./router/index";


createApp(App).use(MasonryWall).use(pinia).use(router).mount("#app");
