const SQL = require('sql-template-strings')
const request = require('supertest')
const { createApp } = require('../app')
const { createDB } = require('../db')

const DAY = 24 * 3600 * 1000
async function addEntry(db, timestamp) {
    const name = `test${timestamp}`
    const timestampDate = new Date(timestamp)
    const dominantHex = 'ff0000'
    const contrastColor = '000000'
    await db.run(SQL`INSERT INTO Photo (name, day, timestamp, color, contrast) VALUES (${name}, ${timestampDate}, ${timestampDate}, ${dominantHex}, ${contrastColor})`)
}

describe('General', () => {
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
        for(let i = 0; i < 14; i++) {
            addEntry(db, first + i * DAY)
        }
        const res = await request(app).get('/q/1/')
        expect(res.body.photos.length).toBe(7)
    })
})
