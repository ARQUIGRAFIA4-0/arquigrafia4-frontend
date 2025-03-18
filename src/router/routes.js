export default [
	{
        path: '/',
        name: 'welcome',
        component: () => import('../views/Home.vue')
	},
	{
        path: '/about',
        name: 'about',
        component: () => import('../views/About.vue')
	},
	{
        path: '/login',
        name: 'login',
        component: () => import('../views/Auth/Login.vue')
	}
]
