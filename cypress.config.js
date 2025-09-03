import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
    viewportWidth: 1000,
    viewportHeight: 600,
  },

  e2e: {
    /* eslint-disable no-unused-vars */
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
