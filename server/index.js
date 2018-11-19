#!/usr/bin/env node
const { ArgumentParser } = require('argparse')
const express = require('express')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const sqlite = require('sqlite')
const SQL = require('sql-template-strings')
const packageInfo = require('./package.json')

const STORAGE_DIR = './media'
const THUMB_DIR = './thumbs'
const DATABASE_FILE = './db.sqlite'
const TZ_OFFSET = 3600 * -8 * 1000

// Parse arguments
var parser = new ArgumentParser({ version: packageInfo.version, addHelp: true, description: packageInfo.description })
parser.addArgument(['-p', '--port'], { help: 'Server Port (default: 8000)', defaultValue: 8000})
parser.addArgument(['--import'], { help: `Fill database with missing photos from ${STORAGE_DIR}`, action: 'storeTrue'})
var args = parser.parseArgs()

// Create thumb directory if it doesn't exist
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR)

async function startServer() {
	const server = express()
	server.use(fileUpload())

	// Open database
	const db = await sqlite.open(DATABASE_FILE)

	server.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "http://localhost:8080")
		res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")
		next()
	})

	// Upload new photo
	server.post('/add/', (req, res) => {

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
		let localDate = new Date(date.valueOf() + TZ_OFFSET)
		let fileName = `${STORAGE_DIR}/${localDate.toISOString().slice(0, 10)}-${date.valueOf() / 1000}.jpg`

		// Write photo
		req.files.photo.mv(fileName, function(err) {
			if (err) return res.status(500).send(err)
			console.info(`Added photo for ${localDate.toISOString().slice(0, 10)}: ${fileName}`)
			res.send('Done!');
		})
	})

	// Query photos
	server.get('/q/', async (req, res) => {
		let photos = await db.all(SQL`SELECT * FROM Photo ORDER BY timestamp DESC LIMIT 7`)
		res.json(photos)
	})

	server.listen(args.port, () => {
		console.info('--- Picorama Server Active (port 8000)')
	})
}

async function importExisting() {
	const db = await sqlite.open(DATABASE_FILE)
	await db.migrate({ force: 'last' })
	for(let photo of fs.readdirSync(STORAGE_DIR)) {
		// Parse date and timestamp
		let parts = photo.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})(-([0-9]+))\.jpg$/)
		if (!parts) {
			console.warn(`Skipping ${photo} - no date found in filename`)
			continue
		}
		if (!Date.parse(parts[1])) {
			console.warn(`Skipping ${photo} - date ${parts[1]} is invalid`)
			continue
		}

		console.info(`Importing ${photo}...`)

		let day = new Date(parts[1])
		let timestamp = parts[3] ? new Date(parseInt(parts[3]) * 1000) : day
		let name = photo.slice(0, -4)

		// Open file and create thumb
		let image = sharp(path.join(STORAGE_DIR, photo)).rotate()
		await image
			.resize(1280)
			.toFile(path.join(THUMB_DIR, photo.replace('.jpg', '-1280.jpg')))
		await image
			.resize(800)
			.toFile(path.join(THUMB_DIR, photo.replace('.jpg', '-800.jpg')))

		// Store in database
		await db.run(SQL`INSERT INTO Photo (name, day, timestamp) VALUES (${name}, ${day}, ${timestamp})`)
	}
}

// Import existing photos (if not already present)
if (args.import) importExisting()
else startServer()
