const connectDatabase =
    require("../../database/connection");

async function getDashboardData() {

    const db =
        await connectDatabase();

    // ============================================
    // ÚLTIMA ANÁLISE
    // ============================================

    const latestScan = await db.get(`
        SELECT
            Scan.id,
            Scan.repositoryId,
            Scan.scanDate,
            Scan.riskScore,
            Scan.riskLevel,
            Scan.totalFindings,
            Scan.duration,
            Repository.name AS repositoryName,
            Repository.url AS repositoryUrl

        FROM Scan

        INNER JOIN Repository
            ON Repository.id = Scan.repositoryId

        ORDER BY Scan.scanDate DESC

        LIMIT 1
    `);

    // ============================================
    // NENHUMA ANÁLISE
    // ============================================

    if (!latestScan) {

        return {

            riskScore: 0,

            riskLevel: "LOW",

            totalFindings: 0,

            criticalFindings: 0,

            highFindings: 0,

            mediumFindings: 0,

            lowFindings: 0,

            securityPosture: 100,

            repositoryStatus: {

                scanner: "Online",

                advisor: "Preview",

                repositories: 0,

                lastScan: null,

                averageScan: "0 sec"

            },

            riskHistory: [],

            topVulnerabilities: [],

            recommendations: []

        };

    }

    // ============================================
    // VULNERABILIDADES
    // ============================================

    const vulnerabilities =
        await db.all(`
            SELECT

                id,

                scanId,

                title,

                severity,

                file,

                line,

                score,

                owaspCategory

            FROM Vulnerability

            WHERE scanId = ?

            ORDER BY

                CASE LOWER(severity)

                    WHEN 'critical' THEN 1

                    WHEN 'error' THEN 1

                    WHEN 'high' THEN 2

                    WHEN 'medium' THEN 3

                    WHEN 'warning' THEN 3

                    WHEN 'low' THEN 4

                    ELSE 5

                END,

                score DESC

        `, [latestScan.id]);

    // ============================================
    // CONTAGEM POR SEVERIDADE
    //
    // ERROR   -> CRITICAL
    // WARNING -> MEDIUM
    // ============================================

    const severityCounts =
        await db.get(`
            SELECT

                SUM(
                    CASE
                        WHEN LOWER(severity)
                            IN ('critical', 'error')
                        THEN 1
                        ELSE 0
                    END
                ) AS critical,

                SUM(
                    CASE
                        WHEN LOWER(severity) = 'high'
                        THEN 1
                        ELSE 0
                    END
                ) AS high,

                SUM(
                    CASE
                        WHEN LOWER(severity)
                            IN ('medium', 'warning')
                        THEN 1
                        ELSE 0
                    END
                ) AS medium,

                SUM(
                    CASE
                        WHEN LOWER(severity) = 'low'
                        THEN 1
                        ELSE 0
                    END
                ) AS low

            FROM Vulnerability

            WHERE scanId = ?

        `, [latestScan.id]);

    const criticalFindings =
        severityCounts?.critical || 0;

    const highFindings =
        severityCounts?.high || 0;

    const mediumFindings =
        severityCounts?.medium || 0;

    const lowFindings =
        severityCounts?.low || 0;

    // ============================================
    // QUANTIDADE DE REPOSITÓRIOS
    // ============================================

    const repositoryCount =
        await db.get(`
            SELECT
                COUNT(*) AS total

            FROM Repository
        `);

    // ============================================
    // TEMPO MÉDIO DE SCAN
    // ============================================

    const averageScan =
        await db.get(`
            SELECT
                AVG(duration) AS average

            FROM Scan

            WHERE duration IS NOT NULL
        `);

    const averageDuration =
        Math.round(
            averageScan?.average || 0
        );

    // ============================================
    // HISTÓRICO
    // ============================================

    const riskHistory =
        await db.all(`
            SELECT

                id,

                scanDate,

                riskScore,

                riskLevel

            FROM Scan

            ORDER BY scanDate DESC

            LIMIT 7
        `);

    // ============================================
    // RECOMENDAÇÕES
    // ============================================

    const recommendations = [];

    if (criticalFindings > 0) {

        recommendations.push(
            "Prioritize remediation of critical vulnerabilities."
        );

    }

    if (highFindings > 0) {

        recommendations.push(
            "Review high severity vulnerabilities before the next deployment."
        );

    }

    if (mediumFindings > 0) {

        recommendations.push(
            "Plan remediation of medium severity vulnerabilities."
        );

    }

    if (recommendations.length === 0) {

        recommendations.push(
            "No immediate remediation actions are required."
        );

    }

    // ============================================
    // RISK SCORE
    // ============================================

    const riskScore =
        latestScan.riskScore || 0;

    // ============================================
    // RISK LEVEL
    // ============================================

    const riskLevel =
        latestScan.riskLevel || "LOW";

    // ============================================
    // SECURITY POSTURE
    // ============================================

    const securityPosture =
        Math.max(
            0,
            Math.min(
                100,
                100 - riskScore
            )
        );

    // ============================================
    // RETORNO
    // ============================================

    return {

        riskScore,

        riskLevel,

        totalFindings:
            latestScan.totalFindings || 0,

        criticalFindings,

        highFindings,

        mediumFindings,

        lowFindings,

        securityPosture,

        repositoryStatus: {

            scanner: "Online",

            advisor: "Preview",

            repositories:
                repositoryCount?.total || 0,

            lastScan:
                latestScan.scanDate,

            averageScan:
                `${averageDuration} sec`

        },

        riskHistory:
            riskHistory.reverse(),

        topVulnerabilities:
            vulnerabilities.slice(0, 10),

        recommendations

    };

}

module.exports = {
    getDashboardData
};