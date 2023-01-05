const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')

function createDB(filename) {
    return sqlite.open({
        filename,
        driver: sqlite3.Database
    })
}

module.exports = { createDB }