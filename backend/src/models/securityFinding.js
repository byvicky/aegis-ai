const crypto = require("crypto");

const SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);
const FINDING_TYPES = new Set(["SAST", "DAST", "SCA", "SECRETS", "IA"]);
const TRIAGE_STATUSES = new Set([
    "NEW",
    "NEEDS_REVIEW",
    "CONFIRMED",
    "FALSE_POSITIVE",
    "ACCEPTED_RISK",
    "SUPPRESSED"
]);

function createFingerprint({ title, file, line, endpoint, package: packageName, cve, evidence }) {
    // Scanner/source deliberately stay out of the identity so a future correlation
    // engine can recognize the same issue reported by multiple tools.
    const identity = [title || "unknown", file || "", line || "", endpoint || "", packageName || "", cve || "", evidence || ""].join("|");
    return crypto.createHash("sha256").update(identity).digest("hex");
}

function createSecurityFinding(input = {}) {
    const severity = String(input.severity || "INFO").toUpperCase();
    const type = String(input.type || "SAST").toUpperCase();
    const triageStatus = String(input.triageStatus || "NEW").toUpperCase();
    const confidence = input.confidence === undefined || input.confidence === null
        ? null
        : Number(input.confidence);

    if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 100)) {
        throw new RangeError("confidence must be a number between 0 and 100.");
    }

    if (!TRIAGE_STATUSES.has(triageStatus)) {
        throw new Error(`Unsupported triageStatus: ${triageStatus}`);
    }

    const finding = {
        id: input.id || null,
        source: input.source || input.scanner || "unknown",
        scanner: input.scanner || input.source || "unknown",
        type: FINDING_TYPES.has(type) ? type : "SAST",
        title: input.title || "Unknown security finding",
        description: input.description,
        severity: SEVERITIES.has(severity) ? severity : "INFO",
        confidence,
        triageStatus,
        triageReason: input.triageReason ?? null,
        file: input.file,
        line: input.line,
        endpoint: input.endpoint,
        method: input.method,
        ruleId: input.ruleId,
        metadata: input.metadata,
        package: input.package,
        cve: input.cve,
        owaspCategory: input.owaspCategory,
        evidence: input.evidence,
        recommendation: input.recommendation
    };
    finding.fingerprint = input.fingerprint || createFingerprint(finding);
    finding.id = finding.id || finding.fingerprint;
    return Object.fromEntries(Object.entries(finding).filter(([, value]) => value !== undefined));
}

module.exports = { createSecurityFinding, createFingerprint, SEVERITIES, FINDING_TYPES, TRIAGE_STATUSES };
