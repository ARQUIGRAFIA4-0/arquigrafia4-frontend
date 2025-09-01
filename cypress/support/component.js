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

// Mount with global plugins pre-configured (Pinia, etc.)
Cypress.Commands.add('mount', (component, options = {}) => {
  const pinia = createPinia()

  const mergedOptions = {
    ...options,
    global: {
      ...(options.global || {}),
      plugins: [...(options.global?.plugins || []), pinia],
    },
  }

  return vueMount(component, mergedOptions)
})

// Example use:
// cy.mount(MyComponent)