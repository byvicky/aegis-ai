const connectDatabase = require("../../database/connection");

async function createRepository(name, url) {

    const db = await connectDatabase();

    const result = await db.run(

        `INSERT INTO Repository(name, url)
         VALUES (?, ?)`,
        [name, url]

    );

    return result.lastID;
}

async function getRepositoryByUrl(url) {

    const db = await connectDatabase();

    return await db.get(

        `SELECT * FROM Repository
         WHERE url = ?`,
        [url]

    );

}

module.exports = {

    createRepository,
    getRepositoryByUrl

};