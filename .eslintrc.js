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
        "cypress/**/*.jsx",
        "cypress/**/*.cy.jsx",
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
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
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
