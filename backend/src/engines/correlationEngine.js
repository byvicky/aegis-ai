const { createFingerprint } = require("../models/securityFinding");

function correlateFindings(findings) {
    const rawFindings = Array.isArray(findings) ? findings : [];
    const groups = new Map();
    rawFindings.forEach((finding) => {
        const fingerprint = finding.fingerprint || createFingerprint(finding);
        const occurrences = groups.get(fingerprint) || [];
        occurrences.push(finding);
        groups.set(fingerprint, occurrences);
    });
    const uniqueFindings = Array.from(groups.entries()).map(([fingerprint, occurrences]) => ({
        ...occurrences[0],
        fingerprint,
        detectedBy: [...new Set(occurrences.map((finding) => finding.scanner || finding.source || "unknown"))],
        occurrenceCount: occurrences.length
    }));
    return { rawFindings, uniqueFindings, rawFindingCount: rawFindings.length, uniqueFindingCount: uniqueFindings.length };
}

module.exports = { correlateFindings };
