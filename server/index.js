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
const SQL = require('sql-template-strings')
const packageInfo = require('./package.json')

const STORAGE_DIR = './media'
const THUMB_DIR = './thumbs'
const DATABASE_FILE = './db.sqlite'
const POSTS_PER_PAGE = 7

if (require.main == module) {
    // Parse arguments
    var parser = new ArgumentParser({ version: packageInfo.version, addHelp: true, description: packageInfo.description })
    parser.addArgument(['-u', '--url'], { help: 'Server URL', required: true })
    parser.addArgument(['-p', '--port'], { help: 'Server Port (default: 8000)', defaultValue: 8000 })
    parser.addArgument(['-a', '--auth'], { help: 'Authentication code' })
    parser.addArgument(['--key'], { help: 'SSL Key (required for HTTPS usage)' })
    parser.addArgument(['--cert'], { help: 'SSL Certificate (required for HTTPS usage' })
    parser.addArgument(['--import'], { help: `Fill database with missing photos from ${STORAGE_DIR}`, action: 'storeTrue' })
    var args = parser.parseArgs()

    // Create thumb directory if it doesn't exist
    if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR)

    startServer(args.auth)
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

async function startServer(authCode) {
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
    const db = await sqlite.open(DATABASE_FILE)

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", args.url)
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")
        next()
    })

    // Upload new photo
    app.post('/add/', async (req, res, next) => {

        // Make sure request is authenticated
        try {
            if (!req.headers.authorization) throw 'No credentials provided'
            let hash = req.headers.authorization.replace('Bearer ', '')
            let result = await bcrypt.compare(authCode, hash)
            if (!result) throw 'Incorrect credentials'
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
        let photo = req.files.photo
        if (!date.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/) || !Date.parse(date)) {
            return res.status(400).send("Invalid date!")
        }

        // Construct file name
        date = new Date(date)
        let timeZoneOffset = date.getTimezoneOffset()
        let localDate = new Date(date.valueOf() - timeZoneOffset * 60 * 1000)
        let fileName = `${STORAGE_DIR}/${localDate.toISOString().slice(0, 10)}-${date.valueOf() / 1000}.jpg`

        // Write photo
        try {
            await req.files.photo.mv(fileName)
            await addEntry(db, path.basename(fileName))
        }
        catch(e) {
            return res.status(500).send(err)
        }

        console.info(`Added photo for ${localDate.toISOString().slice(0, 10)}: ${fileName}`)
        res.send('Done')
    })

    // Query photos
    app.get('/q/:page', async (req, res) => {
        let total = (await db.get(SQL`SELECT COUNT(*) AS total FROM Photo`)).total
        let page = req.params.page ? parseInt(req.params.page) : 1
        // Don't exceed max posts
        let offset = Math.max(0, Math.min(total - POSTS_PER_PAGE, (page - 1) * POSTS_PER_PAGE))
        let photos = await db.all(SQL`SELECT * FROM Photo ORDER BY timestamp DESC LIMIT ${offset}, ${POSTS_PER_PAGE}`)
        let next = offset + POSTS_PER_PAGE < total ? page + 1 : null
        let prev = page > 1 ? page - 1 : null
        res.json({next, photos, prev})
    })

    let httpsCredentials = readCredentials(args)
    let scheme = httpsCredentials ? 'https' : 'http'
    let server = httpsCredentials ? https.createServer(httpsCredentials, app) : http.createServer(app)
    server.listen(args.port, (s) => {
        let addr = server.address()
        console.info(`--- Picorama Server Active at ${scheme}://${addr.address}:${addr.port} ---`)
    })
}

async function addEntry(db, fileName) {
    // Parse date and timestamp
    let parts = fileName.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})(-([0-9]+))\.jpg$/)
    if (!parts) {
        throw 'No date found in filename'
    }
    if (!Date.parse(parts[1])) {
        throw `Date ${parts[1]} is invalid`
    }

    let day = new Date(parts[1])
    let timestamp = parts[3] ? new Date(parseInt(parts[3]) * 1000) : day
    let name = fileName.slice(0, -4)

    // Open file and create thumb
    let image = sharp(path.join(STORAGE_DIR, fileName)).rotate()
    let buffer = await image.toBuffer()
    await image
        .resize(1280)
        .toFile(path.join(THUMB_DIR, fileName.replace('.jpg', '-1280.jpg')))
    await image
        .resize(800)
        .toFile(path.join(THUMB_DIR, fileName.replace('.jpg', '-800.jpg')))

    // Get color palette
    let palette = await colors(buffer, 'image/jpg')
    let dominantHex = palette[0].hex()
    let contrastColor = palette[0].hsl()[2] > 0.5 ? '#000000' : '#ffffff'

    // Store in database
    await db.run(SQL`INSERT INTO Photo (name, day, timestamp, color, contrast) VALUES (${name}, ${day}, ${timestamp}, ${dominantHex}, ${contrastColor})`)
}

module.exports = { addEntry }
