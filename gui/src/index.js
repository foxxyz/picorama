import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { API } from '@/services/api.js'

import App from './app.vue'
import DayHistoryPage from './pages/day-history.vue'
import IndexPage from './pages/index.vue'
import UploadPage from './pages/upload.vue'

// Set up app
const app = createApp(App)

// Set up API
const api = new API()
app.provide('api', api)

// Create routes
const routes = [
    { path: '/', component: IndexPage, name: 'home' },
    { path: '/page/:page([0-9]+)?', component: IndexPage, name: 'page' },
    { path: '/add', component: UploadPage },
    // Redirect to correct page based on YYYY/mm/dd input
    {
        path: '/history/:year([0-9]{1,4})/:month([0-9]{1,2})/:day([0-9]{1,2})?',
        component: () => null,
        beforeEnter: async to => {
            const dateParts = [to.params.year, to.params.month]
            if (to.params.day) dateParts.push(to.params.day)
            const { page } = await api.query(`/page/${dateParts.join('/')}`)
            return { name: 'page', params: { page } }
        }
    },
    { path: '/history/:day([0-9]{1,3})?', component: DayHistoryPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
]

// Initialize router
const router = createRouter({ history: createWebHistory(), routes })
app.use(router)

app.mount('body')