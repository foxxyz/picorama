import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './app.vue'
import IndexPage from './pages/index.vue'

// Register router plugin
Vue.use(VueRouter)

// Create routes
const routes = [
    { path: '/', component: IndexPage }
]

// Initialize router
const router = new VueRouter({ routes })

// Start the app, specifying the router and the initial element to mount App on
const app = new Vue({ router, el: '#app', ...App })
