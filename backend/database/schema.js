const connectDatabase = require("./connection");

async function createTables() {

    const db = await connectDatabase();

    // ==========================
    // Repository
    // ==========================

    await db.exec(`

        CREATE TABLE IF NOT EXISTS Repository (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            url TEXT NOT NULL UNIQUE,

            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

        );

    `);

    // ==========================
    // Finding triage
    // ==========================

    await db.exec(`

        CREATE TABLE IF NOT EXISTS FindingTriage (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            fingerprint TEXT NOT NULL UNIQUE,

            status TEXT NOT NULL DEFAULT 'NEW',

            confidence INTEGER,

            reason TEXT,

            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP

        );

    `);

    // ==========================
    // Scan
    // ==========================

    await db.exec(`

        CREATE TABLE IF NOT EXISTS Scan (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            repositoryId INTEGER NOT NULL,

            scanDate DATETIME DEFAULT CURRENT_TIMESTAMP,

            riskScore INTEGER,

            riskLevel TEXT,

            totalFindings INTEGER,

            duration INTEGER,

            FOREIGN KEY(repositoryId)

            REFERENCES Repository(id)

        );

    `);

    // ==========================
    // Vulnerability
    // ==========================

    await db.exec(`

        CREATE TABLE IF NOT EXISTS Vulnerability (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            scanId INTEGER NOT NULL,

            title TEXT,

            severity TEXT,

            file TEXT,

            line INTEGER,

            score INTEGER,

            owaspCategory TEXT,

            FOREIGN KEY(scanId)

            REFERENCES Scan(id)

        );

    `);

    // Historical correlation needs a small, queryable snapshot of the normalized
    // finding. These columns are additive so existing installations and dashboard
    // queries remain compatible.
    const vulnerabilityColumns = [
        ["fingerprint", "TEXT"], ["scanner", "TEXT"], ["type", "TEXT"],
        ["ruleId", "TEXT"], ["cwe", "TEXT"], ["cve", "TEXT"],
        ["endpoint", "TEXT"], ["method", "TEXT"], ["package", "TEXT"],
        ["normalizedMessage", "TEXT"], ["occurrenceCount", "INTEGER"]
    ];
    const existingColumns = new Set((await db.all("PRAGMA table_info(Vulnerability)")).map((column) => column.name));
    for (const [name, definition] of vulnerabilityColumns) {
        if (!existingColumns.has(name)) await db.exec(`ALTER TABLE Vulnerability ADD COLUMN ${name} ${definition}`);
    }
    await db.exec("CREATE INDEX IF NOT EXISTS idx_vulnerability_fingerprint ON Vulnerability(fingerprint)");
    await db.exec("CREATE INDEX IF NOT EXISTS idx_vulnerability_rule_cwe_cve ON Vulnerability(ruleId, cwe, cve)");

    console.log("Banco criado com sucesso!");

}

module.exports = createTables;
