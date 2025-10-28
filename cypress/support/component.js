// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

import '../../src/scss/styles.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'

import { mount as vueMount } from 'cypress/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import rootRoutes from '../../src/router/routes'
import DefaultLayout from '../../src/layouts/DefaultLayout.vue'

// Mount with global plugins pre-configured (Pinia, etc.)
Cypress.Commands.add('mount', (component, options = {}) => {
  const pinia = createPinia()

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: DefaultLayout,
        children: rootRoutes,
      },
    ],
  })

  const mergedOptions = {
    ...options,
    global: {
      ...(options.global || {}),
      plugins: [...(options.global?.plugins || []), pinia, router],
    },
  }

  return vueMount(component, mergedOptions)
})

/**
 * Set Cypress viewport by label or custom size.
 * Usage: cy.setViewport('iphone-6') or cy.setViewport({ width: 1280, height: 800 })
 */
Cypress.Commands.add('setViewport', (presetOrSize) => {
  if (typeof presetOrSize === 'string') {
    // Preset label, e.g., 'iphone-6', 'macbook-13'
    cy.viewport(presetOrSize)
  } else if (presetOrSize && typeof presetOrSize === 'object') {
    const { width, height } = presetOrSize
    cy.viewport(width, height)
  } else {
    throw new Error('setViewport expects a string preset or { width, height }')
  }
})

/**
 * Mount a component after setting the viewport. Accepts same options as cy.mount.
 * Example: cy.mountWithViewport(UiInput, { props: { ... } }, 'iphone-6')
 */
Cypress.Commands.add('mountWithViewport', (component, options = {}, presetOrSize) => {
  if (!presetOrSize) return cy.mount(component, options)
  return cy
    .setViewport(presetOrSize)
    .then(() => {
      return cy.mount(component, options)
    })
})

// Example use:
// cy.mount(MyComponent)