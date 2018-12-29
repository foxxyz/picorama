import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './app.vue'
import IndexPage from './pages/index.vue'
import UploadPage from './pages/upload.vue'

// Register router plugin
Vue.use(VueRouter)

// Create routes
const routes = [
    { path: '/', component: IndexPage, children: [
    	{ name: 'page', path: '/page/:page', component: IndexPage }
    ] },
    { path: '/add', component: UploadPage },
]

// Initialize router
const router = new VueRouter({ mode: 'history', routes })

// Start the app, specifying the router and the initial element to mount App on
const app = new Vue({ router, el: '#app', ...App })
