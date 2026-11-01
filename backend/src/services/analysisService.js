const { cloneRepository, removeRepository } = require("./gitService");
const { runDefaultScanners } = require("./scannerOrchestrator");
const { correlateFindings } = require("../engines/correlationEngine");
const { calculateRisk, getRiskLevel, getTopRisks } = require("../engines/risk/riskEngine");
const { mapToOWASP } = require("../engines/risk/owaspEngine");
const { createRepository, getRepositoryByUrl } = require("../repositories/repositoryRepository");
const { createScan } = require("../repositories/scanRepository");
const { saveMany } = require("../repositories/vulnerabilityRepository");
const { generateSecurityAdvice } = require("./aiAdvisorService");
const { getTriageByFingerprints } = require("../repositories/findingTriageRepository");
const { applyTriage } = require("./triageService");
const { correlateFindingsWithHistory } = require("./historicalCorrelationService");
const { correlateFindingWithHistory } = require("./aiCorrelationService");

function summarizeHistoricalCorrelation(entries) {
    const records = Array.isArray(entries) ? entries : [];
    const matches = records.flatMap(({ finding, historicalMatches = [] }) =>
        historicalMatches.map((match) => ({ currentFingerprint: finding?.fingerprint || null, ...match }))
    );
    const unavailable = records.filter((entry) => entry.status === "unavailable");

    return {
        status: unavailable.length === records.length && records.length > 0
            ? "unavailable"
            : matches.length > 0 ? "completed" : "no_matches",
        matches,
        entries: records,
        error: unavailable[0]?.error || null
    };
}

function summarizeAiCorrelation(entries) {
    const matches = Array.isArray(entries) ? entries : [];
    const unavailable = matches.find((entry) => entry.status === "unavailable");

    return {
        status: matches.some((entry) => entry.status === "completed")
            ? "completed"
            : unavailable ? "unavailable" : "skipped",
        matches,
        error: unavailable ? { code: unavailable.code, message: unavailable.reason } : null
    };
}

function createAnalyzeHandler(overrides = {}) {
    const dependencies = {
        cloneRepository, removeRepository, runDefaultScanners, correlateFindings,
        calculateRisk, getRiskLevel, getTopRisks, mapToOWASP, createRepository,
        getRepositoryByUrl, createScan, saveMany, generateSecurityAdvice,
        getTriageByFingerprints, applyTriage, correlateFindingsWithHistory,
        correlateFindingWithHistory, ...overrides
    };

    return async (req, res) => {
        let repositoryPath;

        try {
            const { repoUrl, targetUrl } = req.body;
            if (!repoUrl) return res.status(400).json({ success: false, message: "repoUrl é obrigatório." });

            repositoryPath = await dependencies.cloneRepository(repoUrl);
            const scannerRun = await dependencies.runDefaultScanners(repositoryPath, { targetUrl });
            const rawFindings = scannerRun.findings.map((finding) => ({
                ...finding,
                owaspCategory: finding.owaspCategory || dependencies.mapToOWASP(finding.title)
            }));
            const correlation = dependencies.correlateFindings(rawFindings);

            // Historical/AI correlation enrich the result but must never make the
            // deterministic pipeline unavailable. The fingerprint correlation
            // above remains the authoritative source for findings and scoring.
            let historicalCorrelation;
            try {
                historicalCorrelation = await dependencies.correlateFindingsWithHistory(correlation.uniqueFindings);
            } catch (error) {
                historicalCorrelation = correlation.uniqueFindings.map((finding) => ({
                    finding,
                    historicalMatches: [],
                    status: "unavailable",
                    error: { code: "HISTORICAL_CORRELATION_UNAVAILABLE", message: error.message }
                }));
            }

            const aiCorrelation = await Promise.all(historicalCorrelation.map(async ({ finding, historicalMatches = [] }) => {
                if (!finding || !historicalMatches.length) {
                    return {
                        fingerprint: finding?.fingerprint || null,
                        status: "skipped",
                        reason: "No relevant historical candidates."
                    };
                }
                try {
                    return {
                        fingerprint: finding.fingerprint,
                        ...(await dependencies.correlateFindingWithHistory({ finding, historicalMatches }))
                    };
                } catch (error) {
                    return {
                        fingerprint: finding.fingerprint,
                        status: "unavailable",
                        code: "AI_CORRELATION_UNAVAILABLE",
                        reason: error.message
                    };
                }
            }));
            const triageRecords = await dependencies.getTriageByFingerprints(
                correlation.uniqueFindings.map((finding) => finding.fingerprint)
            );
            const triagedRawFindings = dependencies.applyTriage(correlation.rawFindings, triageRecords);
            const triagedUniqueFindings = dependencies.applyTriage(correlation.uniqueFindings, triageRecords);
            const riskScore = dependencies.calculateRisk(triagedUniqueFindings);
            const riskLevel = dependencies.getRiskLevel(riskScore);
            const topRisks = dependencies.getTopRisks(triagedUniqueFindings);
            const repository = await dependencies.getRepositoryByUrl(repoUrl);
            const repositoryId = repository
                ? repository.id
                : await dependencies.createRepository(repoUrl.split("/").pop().replace(".git", ""), repoUrl);
            const scanId = await dependencies.createScan({
                repositoryId, riskScore, riskLevel,
                totalFindings: correlation.uniqueFindingCount, duration: 0
            });
            const findings = triagedUniqueFindings.map((finding) => ({
                ...finding,
                score: topRisks.find((risk) => risk.title === finding.title && risk.file === finding.file)?.score || 0
            }));

            await dependencies.saveMany(scanId, findings);

            let aiAdvisor;
            try {
                aiAdvisor = await dependencies.generateSecurityAdvice(triagedUniqueFindings);
            } catch (error) {
                aiAdvisor = {
                    success: false,
                    error: "The technical analysis was completed, but the AI Security Advisor is temporarily unavailable."
                };
            }

            const scannerResults = (scannerRun.scannerResults || []).map((scannerResult) => ({
                ...scannerResult,
                findings: dependencies.applyTriage(scannerResult.findings || [], triageRecords)
            }));

            return res.status(200).json({
                success: true, repositoryPath, scanId, repositoryId, riskScore,
                riskLevel, totalFindings: findings.length, topRisks, findings,
                aiAdvisor, rawFindings: triagedRawFindings, uniqueFindings: findings,
                rawFindingCount: correlation.rawFindingCount,
                uniqueFindingCount: correlation.uniqueFindingCount,
                historicalCorrelation: summarizeHistoricalCorrelation(historicalCorrelation),
                aiCorrelation: summarizeAiCorrelation(aiCorrelation),
                scanners: scannerRun.scanners,
                scannerResults
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Erro durante a análise", error: error.message });
        } finally {
            if (repositoryPath) {
                try {
                    await dependencies.removeRepository(repositoryPath);
                } catch (cleanupError) {
                    console.error("Unable to remove temporary repository:", cleanupError.message);
                }
            }
        }
    };
}

module.exports = { createAnalyzeHandler, summarizeHistoricalCorrelation, summarizeAiCorrelation };
