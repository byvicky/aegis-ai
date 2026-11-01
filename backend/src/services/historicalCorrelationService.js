const { findCandidates } = require("../repositories/historicalFindingRepository");

function getLimit() {
    const value = Number(process.env.HISTORICAL_CORRELATION_LIMIT);
    return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 100) : 20;
}

function normalized(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreCandidate(finding, candidate) {
    let score = 0;
    const equal = (left, right) => normalized(left) && normalized(left) === normalized(right);
    if (equal(finding.fingerprint, candidate.fingerprint)) score += 100;
    if (equal(finding.scanner, candidate.scanner)) score += 8;
    if (equal(finding.type, candidate.type)) score += 5;
    if (equal(finding.ruleId, candidate.rule)) score += 30;
    if (equal(finding.metadata?.cweId || finding.cwe, candidate.cwe)) score += 25;
    if (equal(finding.cve, candidate.cve)) score += 35;
    if (equal(finding.file, candidate.file)) score += 15;
    if (equal(finding.endpoint, candidate.url)) score += 15;
    if (equal(finding.method, candidate.method)) score += 5;
    if (equal(finding.package, candidate.package)) score += 20;
    if (equal(finding.description || finding.message || finding.title, candidate.normalizedMessage)) score += 10;
    return score;
}

function createHistoricalCorrelationService(repository = { findCandidates }) {
    async function correlateFindingWithHistory(finding, { limit = getLimit() } = {}) {
        const candidates = await repository.findCandidates(finding, { limit });
        const historicalMatches = candidates
            .map((candidate) => ({ ...candidate, similarityScore: scoreCandidate(finding, candidate) }))
            .sort((left, right) => right.similarityScore - left.similarityScore || right.findingId - left.findingId)
            .slice(0, limit);
        return { finding, historicalMatches };
    }

    async function correlateFindingsWithHistory(findings, options) {
        return Promise.all((findings || []).map((finding) => correlateFindingWithHistory(finding, options)));
    }

    return { correlateFindingWithHistory, correlateFindingsWithHistory, scoreCandidate };
}

const service = createHistoricalCorrelationService();

module.exports = { ...service, createHistoricalCorrelationService, getLimit, scoreCandidate };
