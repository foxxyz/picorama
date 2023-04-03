const bcrypt = require('bcrypt')
const colors = require('get-image-colors')
const express = require('express')
const fileUpload = require('express-fileupload')
const path = require('path')
const sharp = require('sharp')
const SQL = require('sql-template-strings')

const STORAGE_DIR = './media'
const THUMB_DIR = './thumbs'
const POSTS_PER_PAGE = 7
// Allow localhost for development
const CORS_WHITE_LIST = ['http://localhost:3000']

function createApp({ authCode, db, url }) {
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

    app.use((req, res, next) => {
        const origin = req.get('origin')
        res.header('Access-Control-Allow-Origin', CORS_WHITE_LIST.includes(origin) ? origin : url)
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization')
        res.header('Cache-Control', 'no-cache')
        next()
    })

    // Upload new photo
    app.post('/add/', async(req, res) => {
        // Make sure request is authenticated
        try {
            if (!req.headers.authorization) throw new Error('No credentials provided')
            const hash = req.headers.authorization.replace('Bearer ', '')
            const result = await bcrypt.compare(authCode, hash)
            if (!result) throw new Error('Incorrect credentials')
        } catch (e) {
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
        date = new Date(`${date}:00Z`)
        const targetName = `${date.toISOString().slice(0, 10)}-${date.valueOf() / 1000}`

        // Write photo
        let outputFile
        try {
            outputFile = await addEntry(db, targetName, req.files.photo)
        } catch (e) {
            console.error(e)
            return res.status(500).send(e.message)
        }

        console.info(`Added photo for ${date.toISOString().slice(0, 10)}: ${outputFile}`)
        res.send('Done')
    })

    // Query by page
    app.get('/q/:page', async(req, res) => {
        const { total, start } = await db.get(SQL`SELECT COUNT(*) AS total, MIN(day) as start FROM Photo`)
        const page = req.params.page ? parseInt(req.params.page) : 1
        // Don't exceed max posts
        const maxPages = Math.ceil(total / POSTS_PER_PAGE)
        const offset = Math.max(0, (page - 1) * POSTS_PER_PAGE)
        const photos = await db.all(SQL`SELECT * FROM Photo ORDER BY timestamp DESC LIMIT ${offset}, ${POSTS_PER_PAGE}`)
        const next = offset + POSTS_PER_PAGE < total ? page + 1 : null
        const prev = page > 1 ? Math.min(maxPages, page - 1) : null
        res.json({ next, photos, prev, start })
    })

    // Query by day of year
    app.get('/history/:dayNum', async(req, res) => {
        const { dayNum } = req.params
        const prefixed = dayNum.padStart(3, '0')
        const photos = await db.all(SQL`SELECT *, strftime('%j', datetime(day/1000, 'unixepoch')) AS dayNum FROM Photo WHERE dayNum = ${prefixed} ORDER BY timestamp DESC`)
        res.json({ photos })
    })

    return app
}

async function addEntry(db, name, { data, mimetype }) {
    // Parse date and timestamp
    const parts = name.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})(-([0-9]+))$/)
    if (!parts) {
        throw new Error('No date found in filename')
    }
    if (!Date.parse(parts[1])) {
        throw new Error(`Date ${parts[1]} is invalid`)
    }

    const day = new Date(parts[1])
    const timestamp = parts[3] ? new Date(parseInt(parts[3]) * 1000) : day

    // Store original
    const outputFile = `${path.join(STORAGE_DIR, name)}.jpg`
    const image = sharp(data).rotate()
    await image.toFile(outputFile)

    // Create thumbs
    const buffer = await image.toBuffer()
    await image
        .resize(1280, 960)
        .toFile(`${path.join(THUMB_DIR, name)}-1280.jpg`)
    await image
        .resize(800, 600)
        .toFile(`${path.join(THUMB_DIR, name)}-800.jpg`)

    // Get color palette
    const palette = await colors(buffer, mimetype)
    const dominantHex = palette[0].hex()
    const contrastColor = palette[0].hsl()[2] > 0.5 ? '#000000' : '#ffffff'

    // Store in database
    await db.run(SQL`INSERT INTO Photo (name, day, timestamp, color, contrast) VALUES (${name}, ${day}, ${timestamp}, ${dominantHex}, ${contrastColor})`)

    return outputFile
}

module.exports = { createApp, addEntry }
