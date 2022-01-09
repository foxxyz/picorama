import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './app.vue'
import IndexPage from './pages/index.vue'
import UploadPage from './pages/upload.vue'

// Set up app
const app = createApp(App)

// Create routes
const routes = [
    { path: '/', component: IndexPage, name: 'home' },
    { path: '/page/:page([0-9]+)?', component: IndexPage, name: 'page' },
    { path: '/add', component: UploadPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
]

// Initialize router
const router = createRouter({ history: createWebHistory(), routes })
app.use(router)

app.mount('body')