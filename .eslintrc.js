/* eslint-disable no-undef */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-essential", "prettier"],
  overrides: [
    {
      files: [
        "cypress/**/*.js",
        "src/**/*.cy.js",
        "src/**/*.cy.jsx",
        "src/**/*.cy.ts",
        "src/**/*.cy.tsx",
      ],
      env: {
        browser: true,
        es2021: true,
        mocha: true,
      },
      globals: {
        cy: "readonly",
        Cypress: "readonly",
      },
      rules: {},
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["vue"],
  rules: {},
};
