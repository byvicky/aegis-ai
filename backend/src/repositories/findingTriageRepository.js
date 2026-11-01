const connectDatabase = require("../../database/connection");
const { TRIAGE_STATUSES } = require("../models/securityFinding");

function createFindingTriageRepository(getDatabase = connectDatabase) {
    async function getTriageByFingerprints(fingerprints) {
        const uniqueFingerprints = [...new Set((fingerprints || []).filter(Boolean))];

        if (uniqueFingerprints.length === 0) {
            return [];
        }

        const db = await getDatabase();
        const placeholders = uniqueFingerprints.map(() => "?").join(", ");

        return db.all(
            `SELECT fingerprint, status, confidence, reason, createdAt, updatedAt
             FROM FindingTriage
             WHERE fingerprint IN (${placeholders})`,
            uniqueFingerprints
        );
    }

    async function upsertFindingTriage({ fingerprint, status, confidence = null, reason = null }) {
        const normalizedStatus = String(status || "NEW").toUpperCase();
        const normalizedConfidence = confidence === null || confidence === undefined ? null : Number(confidence);

        if (!fingerprint) {
            throw new Error("fingerprint is required for triage.");
        }

        if (!TRIAGE_STATUSES.has(normalizedStatus)) {
            throw new Error(`Unsupported triage status: ${normalizedStatus}`);
        }

        if (normalizedConfidence !== null && (!Number.isFinite(normalizedConfidence) || normalizedConfidence < 0 || normalizedConfidence > 100)) {
            throw new RangeError("triage confidence must be a number between 0 and 100.");
        }

        const db = await getDatabase();

        await db.run(
            `INSERT INTO FindingTriage (fingerprint, status, confidence, reason)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(fingerprint) DO UPDATE SET
               status = excluded.status,
               confidence = excluded.confidence,
               reason = excluded.reason,
               updatedAt = CURRENT_TIMESTAMP`,
        [fingerprint, normalizedStatus, normalizedConfidence, reason]
        );
    }

    return { getTriageByFingerprints, upsertFindingTriage };
}

const repository = createFindingTriageRepository();

module.exports = { ...repository, createFindingTriageRepository };
