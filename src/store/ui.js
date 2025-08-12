import { defineStore } from "pinia";

export const uiStore = defineStore("ui", {
  state: () => ({
    viewMode: localStorage.getItem("viewMode") || "grid",
  }),
  actions: {
    setViewMode(mode) {
      this.viewMode = mode;
      localStorage.setItem("viewMode", mode);
    },
  },
});
