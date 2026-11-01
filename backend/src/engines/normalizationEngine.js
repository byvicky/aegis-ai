const { createSecurityFinding } = require("../models/securityFinding");

const SEMGREP_SEVERITY_MAP = { ERROR: "HIGH", WARNING: "MEDIUM", INFO: "INFO" };

function normalizeSeverity(severity) {
    const normalized = String(severity || "INFO").toUpperCase();
    return SEMGREP_SEVERITY_MAP[normalized] || normalized;
}

function normalizeSemgrepFinding(result) {
    const extra = result.extra || {};
    const metadata = extra.metadata || {};
    const severity = normalizeSeverity(extra.severity);
    return createSecurityFinding({
        source: "semgrep", scanner: "semgrep", type: "SAST",
        title: result.check_id || "Semgrep finding", description: extra.message,
        severity, confidence: severity === "INFO" ? 50 : 80,
        file: result.path, line: result.start?.line, evidence: extra.lines,
        recommendation: metadata.remediation,
        owaspCategory: metadata.owasp?.[0] || metadata["owasp-top-ten"]?.[0]
    });
}

function normalizeSemgrepResults(results) {
    return Array.isArray(results) ? results.map(normalizeSemgrepFinding) : [];
}

module.exports = { normalizeSeverity, normalizeSemgrepFinding, normalizeSemgrepResults };
