#!/usr/bin/env node
const { ArgumentParser, ArgumentDefaultsHelpFormatter, SUPPRESS } = require('argparse')
const fs = require('fs')
const http = require('http')
const https = require('https')

const { createApp } = require('./app')
const { createDB } = require('./db')
const packageInfo = require('./package.json')

const DATABASE_FILE = './db.sqlite'
const STORAGE_DIR = './media'
const THUMB_DIR = './thumbs'

// Set HTTPS credentials
function readCredentials({ key, cert }) {
    if (!key || !cert) return
    try {
        key = fs.readFileSync(key)
        cert = fs.readFileSync(cert)
    } catch (e) {
        console.error(`Unable to read SSL key/certificate: ${e}. Falling back to HTTP...`)
    }
    return { key, cert }
}

// Parse arguments
// eslint-disable-next-line camelcase
const parser = new ArgumentParser({ add_help: true, description: packageInfo.description, formatter_class: ArgumentDefaultsHelpFormatter })
parser.add_argument('-v', '--version', { action: 'version', version: packageInfo.version })
parser.add_argument('-u', '--url', { help: 'Server URL', default: '*' })
parser.add_argument('-p', '--port', { help: 'Server Port', default: 8000 })
parser.add_argument('-a', '--auth', { help: 'Authentication code', default: SUPPRESS })
parser.add_argument('--key', { help: 'SSL Key (required for HTTPS usage)', default: SUPPRESS })
parser.add_argument('--cert', { help: 'SSL Certificate (required for HTTPS usage', default: SUPPRESS })
parser.add_argument('--import', { help: `Fill database with missing photos from ${STORAGE_DIR}`, action: 'store_true' })
const args = parser.parse_args()

// Create meda/thumb directory if it doesn't exist
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR)
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR)

async function run() {
    // Open database
    const db = await createDB(DATABASE_FILE)
    const app = createApp({ db, authCode: args.auth, ...args })
    const httpsCredentials = readCredentials(args)
    const scheme = httpsCredentials ? 'https' : 'http'
    const server = httpsCredentials ? https.createServer(httpsCredentials, app) : http.createServer(app)
    server.listen(args.port, () => {
        const addr = server.address()
        console.info(`--- Picorama Server Active at ${scheme}://${addr.address}:${addr.port} ---`)
    })
}
run()
