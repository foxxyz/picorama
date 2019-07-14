#!/usr/bin/env node
const { ArgumentParser } = require('argparse')
const fs = require('fs')
const sqlite = require('sqlite')
const SQL = require('sql-template-strings')
const packageInfo = require('./package.json')

const { addEntry } = require('.')

const STORAGE_DIR = './media'
const DATABASE_FILE = './db.sqlite'

// Parse arguments
var parser = new ArgumentParser({ version: packageInfo.version, addHelp: true, description: `Picorama Administration Tool` })
parser.addArgument(['--import'], { help: `Fill database with missing photos from ${STORAGE_DIR}`, action: 'storeTrue' })
parser.addArgument(['--delete'], { help: `Delete entries for a particular day (I.E. "2018-06-17")`})
var args = parser.parseArgs()

async function deleteEntry(day) {
    const db = await sqlite.open(DATABASE_FILE)
    console.info(`Deleting photos for date ${day}...`)
    day = new Date(day)
    let count = (await db.get(SQL`SELECT COUNT(*) as count FROM Photo WHERE day = ${day}`)).count
    if (!count) {
    	return console.error(`No entries found! Exiting...`)
    }
    console.info(`Removing ${count} entries...`)
    let result = await db.run(SQL`DELETE FROM Photo WHERE day = ${day}`)
    console.info('Success!')
}

async function importExisting() {
    const db = await sqlite.open(DATABASE_FILE)
    await db.migrate({ force: 'last' })
    for(let photo of fs.readdirSync(STORAGE_DIR)) {
        try {
            console.info(`Importing ${photo}...`)
            await addEntry(db, photo)
        }
        catch(e) {
            console.warn(`Skipping ${photo} - ${e}`)
        }
    }
}

if (args.delete) deleteEntry(args.delete)
else if (args.import) importExisting()
