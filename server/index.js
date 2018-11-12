#!/usr/bin/env node
const express = require('express')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const sharp = require('sharp')

const STORAGE_DIR = './media'

const server = express()

server.use(fileUpload())

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
	let fileName = `${STORAGE_DIR}/${date.toISOString().slice(0, 10)}-${date.valueOf() / 1000}.jpg`

	// Write photo
	req.files.photo.mv(fileName, function(err) {
		if (err) return res.status(500).send(err)
		console.info(`Added photo for ${date.toISOString().slice(0, 10)}: ${fileName}`)
		res.send('Done!');
	})
})

server.listen(8000, () => {
	console.info('--- Picorama Server Active (port 8000)')
})
