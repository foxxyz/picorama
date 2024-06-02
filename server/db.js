import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

export function createDB(filename) {
    return open({
        filename,
        driver: sqlite3.Database
    })
}
