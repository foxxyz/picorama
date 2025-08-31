import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { after, before, beforeEach, describe, it, mock } from 'node:test'
import { fileURLToPath } from 'node:url'
import { fs, vol } from 'memfs'
import bcrypt from 'bcrypt'
import SQL from 'sql-template-strings'
import request from 'supertest'

const __dirname = dirname(fileURLToPath(import.meta.url))

vol.fromJSON({
    './media': {},
    './thumbs': {},
})

// Mock sharp so it writes to memfs instead actual filesystem
class MockSharp {
    constructor(data) {
        this.data = data
    }
    resize() {
        return this
    }
    rotate() {
        return this
    }
    toBuffer() {
        return this.data
    }
    async toFile(fileout) {
        fs.writeFileSync(fileout, await this.toBuffer())
    }
}
mock.module('sharp', {
    defaultExport(data) {
        return new MockSharp(data)
    }
})

const { createApp } = await import('../app.js')
const { createDB } = await import('../db.js')

const DAY = 24 * 3600 * 1000
async function addEntry(db, timestamp) {
    const name = `test${timestamp}`
    const timestampDate = new Date(timestamp)
    const dominantHex = 'ff0000'
    const contrastColor = '000000'
    await db.run(SQL`INSERT INTO Photo (name, day, timestamp, color, contrast) VALUES (${name}, ${timestampDate.getTime()}, ${timestampDate.getTime()}, ${dominantHex}, ${contrastColor})`)
}

describe('Querying', () => {
    let app, db
    before(async() => {
        db = await createDB(':memory:')
        await db.migrate()
        app = createApp({ db })
    })
    beforeEach(async() => {
        await db.run(SQL`DELETE FROM Photo`)
    })
    after(async() => {
        await db.close()
    })
    it('Returns 404s for unknown paths', async() => {
        const res = await request(app).get('/')
        assert.equal(res.statusCode, 404)
    })
    it('Returns a week worth of entries on the main endpoint', async() => {
        // 14 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 14; i++) {
            addEntry(db, first + i * DAY)
        }
        const res = await request(app).get('/q/1/')
        assert.equal(res.body.photos.length, 7)
    })
    it('Returns only remaining posts on the last page', async() => {
        // 16 posts should only return 2 only the last post
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        const res = await request(app).get('/q/3/')
        assert.equal(res.body.photos.length, 2)
    })
    it('Returns the last valid previous page if querying past the amount present', async() => {
        // 16 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        // Querying page 10 should return page 3 as the last valid page
        const res = await request(app).get('/q/10/')
        assert.equal(res.body.next, null)
        assert.equal(res.body.photos.length, 0)
        assert.equal(res.body.prev, 3)
    })
    it('Returns the correct page for a particular date', async() => {
        // 16 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        // Querying page 10 should return page 3 as the last valid page
        const res = await request(app).get('/page/2020/08/22')
        assert.equal(res.body.page, 2)
    })
    it('Returns the correct page for a particular month', async() => {
        // 16 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        // Querying page 10 should return page 3 as the last valid page
        const res = await request(app).get('/page/2020/09')
        assert.equal(res.body.page, 1)
    })
    it('Returns the correct dates from history on leap years', async() => {
        // 5 previous years
        for (let i = 0; i < 5; i++) {
            addEntry(db, new Date(`${2019 + i}-05-04`).getTime())
        }
        // Querying day 125 on a leap year should return photos for
        // May 4th on previous years (day 124)
        const res = await request(app).get('/history/2024/125')
        assert.equal(res.body.photos.length, 5)
        // On a non-leap year, day 124 is May 4th and should return the same result
        const res2 = await request(app).get('/history/2025/124')
        assert.equal(res2.body.photos.length, 5)
    })
    it('Returns history photos for Feb 29th', async() => {
        // Two leap year photos
        addEntry(db, new Date('2004-02-29').getTime())
        addEntry(db, new Date('2000-02-29').getTime())
        // Add feb 28th and march 1st for other years
        for (let i = 0; i < 7; i++) {
            addEntry(db, new Date(`${1999 + i}-02-28`).getTime())
            addEntry(db, new Date(`${1999 + i}-03-01`).getTime())
        }
        // Querying Feb 29th should return only 2 entries
        const res = await request(app).get('/history/2024/60')
        assert.equal(res.body.photos.length, 2)
    })
})

describe('Posting', () => {
    let app, db
    before(async() => {
        db = await createDB(':memory:')
        await db.migrate()
        app = createApp({ authCode: 'TESTNG', db })
    })
    beforeEach(async() => {
        await db.run(SQL`DELETE FROM Photo`)
    })
    after(async() => {
        await db.close()
    })
    it('accepts jpg file submissions', async() => {
        const hash = await bcrypt.hash('TESTNG', 10)
        const res = await request(app).post('/add/')
            .set('Authorization', `Bearer ${hash}`)
            .field('date', '2020-08-20T00:19')
            .attach('photo', join(__dirname, 'fixtures/example.jpg'))
        assert.equal(vol.existsSync(join('.', 'thumbs', '2020-08-20-1597882740-1280.jpg')), true)
        assert.equal(vol.existsSync(join('.', 'thumbs', '2020-08-20-1597882740-800.jpg')), true)
        assert.equal(vol.existsSync(join('.', 'media', '2020-08-20-1597882740.jpg')), true)
        assert.equal(res.statusCode, 200)
    })
    it('accepts png file submissions', async() => {
        const hash = await bcrypt.hash('TESTNG', 10)
        const res = await request(app).post('/add/')
            .set('Authorization', `Bearer ${hash}`)
            .field('date', '2020-01-01T00:00')
            .attach('photo', join(__dirname, 'fixtures/example.png'))
        assert.equal(vol.existsSync(join('.', 'thumbs', '2020-01-01-1577836800-1280.jpg')), true)
        assert.equal(vol.existsSync(join('.', 'thumbs', '2020-01-01-1577836800-800.jpg')), true)
        assert.equal(vol.existsSync(join('.', 'media', '2020-01-01-1577836800.jpg')), true)
        assert.equal(res.statusCode, 200)
    })
    it('rejects submissions without authentication', async() => {
        const res = await request(app).post('/add/')
            .field('date', '2020-08-20T00:19')
            .attach('photo', join(__dirname, 'fixtures/example.jpg'))
        assert.equal(res.statusCode, 403)
    })
    it('rejects submissions with invalid auth codes', async() => {
        const res = await request(app).post('/add/')
            .set('Authorization', 'Bearer INVALID')
            .field('date', '2020-08-20T00:19')
            .attach('photo', join(__dirname, 'fixtures/example.jpg'))
        assert.equal(res.text, 'Authentication Failure')
        assert.equal(res.statusCode, 403)
    })
})