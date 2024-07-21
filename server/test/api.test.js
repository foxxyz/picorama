import { jest } from '@jest/globals'
import { dirname, join } from 'node:path'
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
jest.unstable_mockModule('sharp', () => {
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
    return {
        default(data) {
            return new MockSharp(data)
        }
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
    beforeAll(async() => {
        db = await createDB(':memory:')
        await db.migrate()
        app = createApp({ db })
    })
    beforeEach(async() => {
        await db.run(SQL`DELETE FROM Photo`)
    })
    afterAll(async() => {
        await db.close()
    })
    it('Returns 404s for unknown paths', async() => {
        const res = await request(app).get('/')
        expect(res.statusCode).toBe(404)
    })
    it('Returns a week worth of entries on the main endpoint', async() => {
        // 14 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 14; i++) {
            addEntry(db, first + i * DAY)
        }
        const res = await request(app).get('/q/1/')
        expect(res.body.photos.length).toBe(7)
    })
    it('Returns only remaining posts on the last page', async() => {
        // 16 posts should only return 2 only the last post
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        const res = await request(app).get('/q/3/')
        expect(res.body.photos.length).toBe(2)
    })
    it('Returns the last valid previous page if querying past the amount present', async() => {
        // 16 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        // Querying page 10 should return page 3 as the last valid page
        const res = await request(app).get('/q/10/')
        expect(res.body.next).toBe(null)
        expect(res.body.photos.length).toBe(0)
        expect(res.body.prev).toBe(3)
    })
    it('Returns the correct page for a particular date', async() => {
        // 16 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        // Querying page 10 should return page 3 as the last valid page
        const res = await request(app).get('/page/2020/08/22')
        expect(res.body.page).toBe(2)
    })
    it('Returns the correct page for a particular month', async() => {
        // 16 test posts
        const first = new Date('2020-08-20').getTime()
        for (let i = 0; i < 16; i++) {
            addEntry(db, first + i * DAY)
        }
        // Querying page 10 should return page 3 as the last valid page
        const res = await request(app).get('/page/2020/09')
        expect(res.body.page).toBe(1)
    })
})

describe('Posting', () => {
    let app, db
    beforeAll(async() => {
        db = await createDB(':memory:')
        await db.migrate()
        app = createApp({ authCode: 'TESTNG', db })
    })
    beforeEach(async() => {
        await db.run(SQL`DELETE FROM Photo`)
    })
    afterAll(async() => {
        await db.close()
    })
    it('accepts jpg file submissions', async() => {
        const hash = await bcrypt.hash('TESTNG', 10)
        const res = await request(app).post('/add/')
            .set('Authorization', `Bearer ${hash}`)
            .field('date', '2020-08-20T00:19')
            .attach('photo', join(__dirname, 'fixtures/example.jpg'))
        expect(vol.existsSync(join('.', 'thumbs', '2020-08-20-1597882740-1280.jpg'))).toBe(true)
        expect(vol.existsSync(join('.', 'thumbs', '2020-08-20-1597882740-800.jpg'))).toBe(true)
        expect(vol.existsSync(join('.', 'media', '2020-08-20-1597882740.jpg'))).toBe(true)
        expect(res.statusCode).toBe(200)
    })
    it('accepts png file submissions', async() => {
        const hash = await bcrypt.hash('TESTNG', 10)
        const res = await request(app).post('/add/')
            .set('Authorization', `Bearer ${hash}`)
            .field('date', '2020-01-01T00:00')
            .attach('photo', join(__dirname, 'fixtures/example.png'))
        expect(vol.existsSync(join('.', 'thumbs', '2020-01-01-1577836800-1280.jpg'))).toBe(true)
        expect(vol.existsSync(join('.', 'thumbs', '2020-01-01-1577836800-800.jpg'))).toBe(true)
        expect(vol.existsSync(join('.', 'media', '2020-01-01-1577836800.jpg'))).toBe(true)
        expect(res.statusCode).toBe(200)
    })
    it('rejects submissions without authentication', async() => {
        const res = await request(app).post('/add/')
            .field('date', '2020-08-20T00:19')
            .attach('photo', join(__dirname, 'fixtures/example.jpg'))
        expect(res.statusCode).toBe(403)
    })
    it('rejects submissions with invalid auth codes', async() => {
        const res = await request(app).post('/add/')
            .set('Authorization', 'Bearer INVALID')
            .field('date', '2020-08-20T00:19')
            .attach('photo', join(__dirname, 'fixtures/example.jpg'))
        expect(res.text).toBe('Authentication Failure')
        expect(res.statusCode).toBe(403)
    })
})