#!/usr/bin/env node
const { ArgumentParser } = require('argparse')
const bcrypt = require('bcrypt')
const colors = require('get-image-colors')
const express = require('express')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const sharp = require('sharp')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const SQL = require('sql-template-strings')
const packageInfo = require('./package.json')

const STORAGE_DIR = './media'
const THUMB_DIR = './thumbs'
const DATABASE_FILE = './db.sqlite'
const POSTS_PER_PAGE = 7
// Allow localhost for development
const CORS_WHITE_LIST = ['http://localhost:3000']

if (require.main === module) {
    // Parse arguments
    const parser = new ArgumentParser({ add_help: true, description: packageInfo.description })
    parser.add_argument('-v', '--version', { action: 'version', version: packageInfo.version })
    parser.add_argument('-u', '--url', { help: 'Server URL', default: '*' })
    parser.add_argument('-p', '--port', { help: 'Server Port (default: 8000)', default: 8000 })
    parser.add_argument('-a', '--auth', { help: 'Authentication code' })
    parser.add_argument('--key', { help: 'SSL Key (required for HTTPS usage)' })
    parser.add_argument('--cert', { help: 'SSL Certificate (required for HTTPS usage' })
    parser.add_argument('--import', { help: `Fill database with missing photos from ${STORAGE_DIR}`, action: 'store_true' })
    const args = parser.parse_args()

    // Create thumb directory if it doesn't exist
    if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR)

    startServer(args)
}

// Set HTTPS credentials
function readCredentials({ key, cert }) {
    if (!key || !cert) return
    try {
        key = fs.readFileSync(key)
        cert = fs.readFileSync(cert)
    }
    catch(e) {
        console.error(`Unable to read SSL key/certificate: ${e}. Falling back to HTTP...`)
    }
    return { key, cert }
}

async function startServer({ url, port, auth: authCode, key, cert }) {
    const app = express()
    app.use(fileUpload())

    // Make sure we have an auth code
    if (!authCode) {
        // Check environment variables
        authCode = process.env.PICORAMA_AUTH_CODE
        // Generate an auth code if we still don't have one
        if (!authCode) {
            authCode = Math.round(Math.random() * 655533).toString(16)
            console.warn(`No authentication code was passed or found in 'PICORAMA_AUTH_CODE'. Your randomly generated auth code is: ${authCode}`)
        }
    }

    // Open database
    const db = await sqlite.open({
        filename: DATABASE_FILE,
        driver: sqlite3.Database
    })

    app.use((req, res, next) => {
        const origin = req.get('origin')
        res.header('Access-Control-Allow-Origin', CORS_WHITE_LIST.includes(origin) ? origin : url)
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization')
        res.header('Cache-Control', 'no-cache')
        next()
    })

    // Upload new photo
    app.post('/add/', async (req, res) => {
        // Make sure request is authenticated
        try {
            if (!req.headers.authorization) throw new Error('No credentials provided')
            const hash = req.headers.authorization.replace('Bearer ', '')
            const result = await bcrypt.compare(authCode, hash)
            if (!result) throw new Error('Incorrect credentials')
        }
        catch(e) {
            console.warn(`Auth failure for request from ${req.ip}: ${e}`)
            return res.status(403).send('Authentication Failure')
        }

        // Make sure parameters are present
        if (!req.body || !req.body.date || !req.files || !req.files.photo) {
            return res.status(400).send('Photo or date missing!')
        }

        // Check parameter types
        let date = req.body.date
        if (!date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/) || !Date.parse(date)) {
            return res.status(400).send('Invalid date!')
        }

        // Construct file name
        date = new Date(date)
        const timeZoneOffset = date.getTimezoneOffset()
        const localDate = new Date(date.valueOf() - timeZoneOffset * 60 * 1000)
        const fileName = `${STORAGE_DIR}/${localDate.toISOString().slice(0, 10)}-${date.valueOf() / 1000}.jpg`

        // Write photo
        try {
            await req.files.photo.mv(fileName)
            await addEntry(db, path.basename(fileName))
        }
        catch(e) {
            return res.status(500).send(e.message)
        }

        console.info(`Added photo for ${localDate.toISOString().slice(0, 10)}: ${fileName}`)
        res.send('Done')
    })

    // Query by page
    app.get('/q/:page', async (req, res) => {
        const total = (await db.get(SQL`SELECT COUNT(*) AS total FROM Photo`)).total
        const page = req.params.page ? parseInt(req.params.page) : 1
        // Don't exceed max posts
        const offset = Math.max(0, Math.min(total - POSTS_PER_PAGE, (page - 1) * POSTS_PER_PAGE))
        const photos = await db.all(SQL`SELECT * FROM Photo ORDER BY timestamp DESC LIMIT ${offset}, ${POSTS_PER_PAGE}`)
        const next = offset + POSTS_PER_PAGE < total ? page + 1 : null
        const prev = page > 1 ? page - 1 : null
        res.json({ next, photos, prev })
    })

    // Query by day of year
    app.get('/history/:dayNum', async (req, res) => {
        const { dayNum } = req.params
        const prefixed = dayNum.padStart(3, '0')
        const photos = await db.all(SQL`SELECT *, strftime('%j', datetime(day/1000, 'unixepoch')) AS dayNum FROM Photo WHERE dayNum = ${prefixed} ORDER BY timestamp DESC LIMIT 10`)
        res.json({ photos })
    })

    const httpsCredentials = readCredentials({ key, cert })
    const scheme = httpsCredentials ? 'https' : 'http'
    const server = httpsCredentials ? https.createServer(httpsCredentials, app) : http.createServer(app)
    server.listen(port, () => {
        const addr = server.address()
        console.info(`--- Picorama Server Active at ${scheme}://${addr.address}:${addr.port} ---`)
    })
}

async function addEntry(db, fileName) {
    // Parse date and timestamp
    const parts = fileName.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})(-([0-9]+))\.jpg$/)
    if (!parts) {
        throw new Error('No date found in filename')
    }
    if (!Date.parse(parts[1])) {
        throw new Error(`Date ${parts[1]} is invalid`)
    }

    const day = new Date(parts[1])
    const timestamp = parts[3] ? new Date(parseInt(parts[3]) * 1000) : day
    const name = fileName.slice(0, -4)

    // Open file and create thumb
    const image = sharp(path.join(STORAGE_DIR, fileName)).rotate()
    const buffer = await image.toBuffer()
    await image
        .resize(1280)
        .toFile(path.join(THUMB_DIR, fileName.replace('.jpg', '-1280.jpg')))
    await image
        .resize(800)
        .toFile(path.join(THUMB_DIR, fileName.replace('.jpg', '-800.jpg')))

    // Get color palette
    const palette = await colors(buffer, 'image/jpg')
    const dominantHex = palette[0].hex()
    const contrastColor = palette[0].hsl()[2] > 0.5 ? '#000000' : '#ffffff'

    // Store in database
    await db.run(SQL`INSERT INTO Photo (name, day, timestamp, color, contrast) VALUES (${name}, ${day}, ${timestamp}, ${dominantHex}, ${contrastColor})`)
}

module.exports = { addEntry }
