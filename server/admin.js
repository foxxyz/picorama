#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { ArgumentParser } from 'argparse'
import SQL from 'sql-template-strings'
import packageInfo from './package.json' with { type: 'json' }

import { addEntry } from './app.js'
import { createDB } from './db.js'

const STORAGE_DIR = './media'
const DATABASE_FILE = './db.sqlite'

// Parse arguments
// eslint-disable-next-line camelcase
const parser = new ArgumentParser({ add_help: true, description: 'Picorama Administration Tool' })
parser.add_argument('-v', '--version', { action: 'version', version: packageInfo.version })
parser.add_argument('--import', { help: `Fill database with missing photos from ${STORAGE_DIR}`, action: 'store_true' })
parser.add_argument('--delete', { help: 'Delete entries for a particular day (I.E. "2018-06-17")' })
parser.add_argument('--create', { help: 'Create initial database', action: 'store_true' })
const args = parser.parse_args()

async function createInitial() {
    const db = await createDB(DATABASE_FILE)
    await db.migrate()
}

async function deleteEntry(day) {
    const db = await createDB(DATABASE_FILE)

    console.info(`Deleting photos for date ${day}...`)
    day = new Date(day)
    const count = (await db.get(SQL`SELECT COUNT(*) as count FROM Photo WHERE day = ${day}`)).count
    if (!count) {
        return console.error('No entries found! Exiting...')
    }
    console.info(`Removing ${count} entries...`)
    await db.run(SQL`DELETE FROM Photo WHERE day = ${day}`)
    console.info('Success!')
}

async function importExisting() {
    const db = await createDB(DATABASE_FILE)

    await db.migrate({ force: 'last' })
    for (const photo of readdirSync(STORAGE_DIR)) {
        try {
            console.info(`Importing ${photo}...`)
            await addEntry(db, photo)
        } catch (e) {
            console.warn(`Skipping ${photo} - ${e}`)
        }
    }
}

if (args.delete) deleteEntry(args.delete)
else if (args.import) importExisting()
else if (args.create) createInitial()