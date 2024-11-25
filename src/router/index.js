import { createWebHistory, createRouter } from 'vue-router'

import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../layouts/DefaultLayout.vue'),
      children: routes,
    }
  ]
})

export default router
