const connectDatabase = require("../../database/connection");

function normalizeMessage(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 1000);
}

function createHistoricalFindingRepository(getDatabase = connectDatabase) {
    async function findCandidates(finding, { limit = 20 } = {}) {
        const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
        const conditions = [];
        const parameters = [];
        const add = (column, value) => {
            if (value !== undefined && value !== null && String(value).trim()) {
                conditions.push(`v.${column} = ?`);
                parameters.push(String(value).trim());
            }
        };

        add("fingerprint", finding.fingerprint);
        add("ruleId", finding.ruleId);
        add("cwe", finding.metadata?.cweId || finding.cwe);
        add("cve", finding.cve);
        add("file", finding.file);
        add("endpoint", finding.endpoint);
        add("package", finding.package);
        add("normalizedMessage", normalizeMessage(finding.description || finding.message || finding.title));

        if (conditions.length === 0) return [];

        const db = await getDatabase();
        return db.all(
            `SELECT v.id AS findingId, v.fingerprint, v.scanner, v.type, v.severity,
                    v.ruleId AS rule, v.cwe, v.cve, v.file, v.endpoint AS url,
                    v.method, v.package, v.normalizedMessage, v.occurrenceCount,
                    history.firstSeen, history.lastSeen,
                    t.status AS triageStatus, t.confidence AS triageConfidence,
                    t.reason AS triageReason, t.updatedAt AS triageUpdatedAt
             FROM Vulnerability v
             JOIN Scan s ON s.id = v.scanId
             LEFT JOIN (
                 SELECT v2.fingerprint, MIN(s2.scanDate) AS firstSeen, MAX(s2.scanDate) AS lastSeen
                 FROM Vulnerability v2 JOIN Scan s2 ON s2.id = v2.scanId
                 WHERE v2.fingerprint IS NOT NULL
                 GROUP BY v2.fingerprint
             ) history ON history.fingerprint = v.fingerprint
             LEFT JOIN FindingTriage t ON t.fingerprint = v.fingerprint
             WHERE ${conditions.join(" OR ")}
             ORDER BY s.scanDate DESC, v.id DESC
             LIMIT ?`,
            [...parameters, safeLimit]
        );
    }

    return { findCandidates };
}

const repository = createHistoricalFindingRepository();

module.exports = { ...repository, createHistoricalFindingRepository, normalizeMessage };
