import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './app.vue'
import IndexPage from './pages/index.vue'
import UploadPage from './pages/upload.vue'

// Set up app
const app = createApp(App)

// Create routes
const routes = [
    { path: '/', component: IndexPage, children: [
        { name: 'page', path: '/page/:page', component: IndexPage }
    ] },
    { path: '/add', component: UploadPage },
]

// Initialize router
const router = createRouter({ history: createWebHistory(), routes })
app.use(router)

app.mount('body')