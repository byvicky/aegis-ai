const connectDatabase = require("../../database/connection");

async function createScan(scan) {

    const db = await connectDatabase();

    const result = await db.run(

        `
        INSERT INTO Scan(

            repositoryId,
            riskScore,
            riskLevel,
            totalFindings,
            duration

        )

        VALUES (?, ?, ?, ?, ?)

        `,

        [

            scan.repositoryId,
            scan.riskScore,
            scan.riskLevel,
            scan.totalFindings,
            scan.duration

        ]

    );

    return result.lastID;

}

module.exports = {

    createScan

};