const request = require('supertest')
const { createApp } = require('../app')

describe('General', () => {
    let app
    beforeAll(async() => {
        app = await createApp()
    })
    it('Returns 404s for unknown paths', async() => {
        const res = await request(app).get('/')
        expect(res.statusCode).toBe(404)
    })
})
