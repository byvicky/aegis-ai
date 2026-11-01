const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

async function connectDatabase() {

    const db = await open({

        filename: path.join(__dirname, "aegis.db"),

        driver: sqlite3.Database

    });

    return db;

}

module.exports = connectDatabase;