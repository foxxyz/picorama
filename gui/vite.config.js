import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import sirv from 'sirv'

// Middleware to serve a static photos directory from accessing /photos/...
function servePhotosMiddleware(directory) {
    const serve = sirv(directory)
    return function(req, res, next) {
        req.url = req.url.replace('/photos/', '/')
        serve(req, res, next)
    }
}

// Plugin for serving static images from ../server/thumbs under http://.../photos/..
const serveImages = () => ({
    name: 'serve-images',
    configureServer(server) {
        server.middlewares.use(servePhotosMiddleware('../server/thumbs'))
    }
})

export default {
    plugins: [vue(), serveImages()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        }
    }
}
