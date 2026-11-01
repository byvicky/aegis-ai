const { getOllamaClient, getOllamaModel } = require("./aiAdvisorService");

function getTimeout() {
    const value = Number(process.env.OLLAMA_CORRELATION_TIMEOUT);
    return Number.isFinite(value) && value > 0 ? value : 10000;
}

function cleanJson(value) {
    return String(value || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function isEligible(historicalMatches) {
    const matches = historicalMatches || [];
    const top = matches[0];
    return Boolean(top && top.similarityScore >= 25 && (matches.length > 1 || top.similarityScore < 100));
}

function createAiCorrelationService({ client = getOllamaClient(), model = process.env.OLLAMA_CORRELATION_MODEL || getOllamaModel(), timeoutMs = getTimeout() } = {}) {
    async function correlateFindingWithHistory({ finding, historicalMatches = [] }) {
        if (!isEligible(historicalMatches)) {
            return { status: "skipped", reason: "No ambiguous, relevant historical candidates." };
        }

        const context = {
            finding: {
                fingerprint: finding.fingerprint, scanner: finding.scanner, type: finding.type,
                title: finding.title, severity: finding.severity, ruleId: finding.ruleId,
                cve: finding.cve, cwe: finding.metadata?.cweId || finding.cwe,
                file: finding.file, endpoint: finding.endpoint, method: finding.method, package: finding.package
            },
            historicalMatches: historicalMatches.map(({ findingId, fingerprint, scanner, type, severity, rule, cwe, cve, file, url, method, package, triageStatus, triageReason, similarityScore }) =>
                ({ findingId, fingerprint, scanner, type, severity, rule, cwe, cve, file, url, method, package, triageStatus, triageReason, similarityScore }))
        };
        const prompt = `You assess whether a current security finding is related to selected historical candidates. Do not make triage, severity, risk, or deletion decisions. Return only JSON: {"correlated":boolean,"confidence":number,"relatedFindings":[],"reason":"","signals":[]}. Confidence must be between 0 and 1.\n${JSON.stringify(context)}`;

        let timer;
        try {
            const request = client.chat({ model, messages: [{ role: "user", content: prompt }], stream: false, options: { temperature: 0 } });
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => reject(Object.assign(new Error("AI correlation timed out."), { code: "AI_CORRELATION_TIMEOUT" })), timeoutMs);
            });
            const response = await Promise.race([request, timeout]);
            const suggestion = JSON.parse(cleanJson(response?.message?.content));
            if (typeof suggestion.correlated !== "boolean" || !Number.isFinite(suggestion.confidence) || suggestion.confidence < 0 || suggestion.confidence > 1 || !Array.isArray(suggestion.relatedFindings)) {
                throw new Error("AI correlation returned an invalid JSON contract.");
            }
            return {
                status: "completed", correlated: suggestion.correlated, confidence: suggestion.confidence,
                relatedFindings: suggestion.relatedFindings, reason: String(suggestion.reason || ""),
                signals: Array.isArray(suggestion.signals) ? suggestion.signals : []
            };
        } catch (error) {
            return { status: "unavailable", code: error.code || "AI_CORRELATION_UNAVAILABLE", reason: error.message };
        } finally {
            clearTimeout(timer);
        }
    }
    return { correlateFindingWithHistory };
}

const service = createAiCorrelationService();
module.exports = { ...service, createAiCorrelationService, isEligible, getTimeout };
