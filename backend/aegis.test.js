const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createSecurityFinding, createFingerprint } = require("./src/models/securityFinding");
const { applyTriage } = require("./src/services/triageService");
const { createFindingTriageRepository } = require("./src/repositories/findingTriageRepository");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const { normalizeSemgrepResults } = require("./src/engines/normalizationEngine");
const { calculateRisk, getRiskLevel } = require("./src/engines/risk/riskEngine");
const { executeSemgrep } = require("./src/scanners/semgrepScanner");
const {
    hasPythonFiles,
    normalizeBanditResults,
    executeBandit
} = require("./src/scanners/banditScanner");
const {
    hasSupportedDependencyFiles,
    normalizeTrivyResults,
    executeTrivy
} = require("./src/scanners/trivyScanner");
const {
    normalizeZapResults,
    executeZap
} = require("./src/scanners/zapScanner");
const { correlateFindings } = require("./src/engines/correlationEngine");
const { runScanners, resolveZapTargetUrl } = require("./src/services/scannerOrchestrator");
const { createAnalyzeHandler } = require("./src/services/analysisService");
const { createHistoricalCorrelationService } = require("./src/services/historicalCorrelationService");
const { createAiCorrelationService } = require("./src/services/aiCorrelationService");

function semgrepResult(severity) {
    return { check_id: "javascript.lang.security.audit.sql-injection", path: "src/auth.js", start: { line: 7 }, extra: { severity, message: "Unsafe query", lines: "db.query(input)" } };
}

function banditResult(severity = "HIGH") {
    return {
        filename: "app.py",
        line_number: 3,
        issue_severity: severity,
        issue_confidence: "HIGH",
        issue_text: "subprocess call with shell=True",
        test_id: "B602",
        test_name: "subprocess_popen_with_shell_equals_true",
        code: "subprocess.call('echo fixture', shell=True)"
    };
}

function trivyResult(severity = "HIGH") {
    return {
        Results: [{
            Target: "package-lock.json",
            Vulnerabilities: [{
                VulnerabilityID: "CVE-2024-12345",
                PkgName: "example-package",
                InstalledVersion: "1.0.0",
                FixedVersion: "1.0.1",
                Severity: severity,
                Title: "Example dependency vulnerability",
                Description: "A dependency vulnerability for testing."
            }]
        }]
    };
}

function zapReport(risk = "High") {
    return {
        site: [{ alerts: [{
            alert: "Cross Site Scripting",
            risk,
            confidence: "Medium",
            url: "http://localhost:3000/search?q=example",
            method: "GET",
            evidence: "<script>",
            description: "Reflected input was found.",
            solution: "Encode untrusted output.",
            reference: "https://www.zaproxy.org/docs/",
            cweid: "79",
            wascid: "8",
            pluginId: "40012",
            param: "q"
        }] }]
    };
}

test("SecurityFinding creates defaults and deterministic fingerprints", () => {
    const input = { scanner: "semgrep", title: "rule", file: "src/a.js", line: 2, evidence: "x" };
    const first = createSecurityFinding(input);
    const second = createSecurityFinding(input);
    assert.equal(first.type, "SAST");
    assert.equal(first.severity, "INFO");
    assert.equal(first.fingerprint, second.fingerprint);
    assert.equal(first.id, first.fingerprint);
    assert.equal(createFingerprint(input), first.fingerprint);
    assert.equal(first.triageStatus, "NEW");
    assert.equal(first.triageReason, null);
    assert.equal(first.confidence, null);
});

test("SecurityFinding accepts confidence boundaries and rejects invalid values", () => {
    assert.equal(createSecurityFinding({ title: "zero", confidence: 0 }).confidence, 0);
    assert.equal(createSecurityFinding({ title: "one hundred", confidence: 100 }).confidence, 100);
    assert.throws(() => createSecurityFinding({ title: "below", confidence: -1 }), /between 0 and 100/);
    assert.throws(() => createSecurityFinding({ title: "above", confidence: 101 }), /between 0 and 100/);
});

test("persisted triage is applied by fingerprint and old findings remain compatible", () => {
    const finding = createSecurityFinding({ title: "secret", file: "app.js", line: 1 });
    const [triaged] = applyTriage([finding], [{
        fingerprint: finding.fingerprint,
        status: "FALSE_POSITIVE",
        confidence: 100,
        reason: "Reviewed by analyst"
    }]);
    const [legacy] = applyTriage([{ title: "old", fingerprint: "legacy-fingerprint" }], []);
    assert.equal(triaged.triageStatus, "FALSE_POSITIVE");
    assert.equal(triaged.triageReason, "Reviewed by analyst");
    assert.equal(triaged.confidence, 100);
    assert.equal(legacy.triageStatus, "NEW");
    assert.equal(legacy.triageReason, null);
});

test("persisted triage is recovered by fingerprint in a later analysis", async () => {
    const db = await open({ filename: ":memory:", driver: sqlite3.Database });
    await db.exec(`CREATE TABLE FindingTriage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        confidence INTEGER,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    const repository = createFindingTriageRepository(async () => db);
    await repository.upsertFindingTriage({
        fingerprint: "stable-fingerprint",
        status: "FALSE_POSITIVE",
        confidence: 100,
        reason: "Analyst review"
    });
    const records = await repository.getTriageByFingerprints(["stable-fingerprint"]);
    const [finding] = applyTriage([{ fingerprint: "stable-fingerprint", title: "reappeared" }], records);
    assert.equal(finding.triageStatus, "FALSE_POSITIVE");
    assert.equal(finding.triageReason, "Analyst review");
    await assert.rejects(
        repository.upsertFindingTriage({ fingerprint: "stable-fingerprint", status: "UNKNOWN" }),
        /Unsupported triage status/
    );
    await db.close();
});

test("normalization maps Semgrep ERROR to HIGH and WARNING to MEDIUM", () => {
    const [error, warning] = normalizeSemgrepResults([semgrepResult("ERROR"), semgrepResult("WARNING")]);
    assert.equal(error.severity, "HIGH");
    assert.equal(warning.severity, "MEDIUM");
    assert.equal(error.description, "Unsafe query");
});

test("Risk Engine preserves legacy scores for normalized severities", () => {
    assert.equal(calculateRisk([{ severity: "HIGH", title: "sql injection", file: "src/auth.js" }]), 45);
    assert.equal(calculateRisk([{ severity: "MEDIUM", title: "ordinary", file: "src/app.js" }]), 5);
    assert.equal(getRiskLevel(45), "LOW");
    assert.equal(calculateRisk([{ severity: "HIGH", title: "sql injection", file: "src/auth.js", triageStatus: "FALSE_POSITIVE" }]), 45);
});

test("semgrepScanner rejects when Semgrep returns no output", async () => {
    await assert.rejects(
        executeSemgrep("fixture", { execFileFn: (file, args, options, callback) => callback(new Error("not found"), "", "not found") }),
        /not found/
    );
});

test("Bandit is skipped for a repository without Python files", async () => {
    const fixture = path.join(__dirname, "fixtures", "small-repository");
    assert.equal(await hasPythonFiles(fixture), false);
    const result = await runScanners(fixture, [{
        scanner: "Bandit",
        type: "SAST",
        isApplicable: hasPythonFiles,
        run: async () => { throw new Error("must not run"); }
    }]);
    assert.equal(result.scannerResults[0].status, "skipped");
});

test("Bandit JSON output is normalized with standard severities and fingerprint", () => {
    const [high, medium, low] = normalizeBanditResults([
        banditResult("HIGH"), banditResult("MEDIUM"), banditResult("LOW")
    ]);
    assert.equal(high.scanner, "Bandit");
    assert.equal(high.type, "SAST");
    assert.equal(high.severity, "HIGH");
    assert.equal(medium.severity, "MEDIUM");
    assert.equal(low.severity, "LOW");
    assert.equal(high.file, "app.py");
    assert.equal(high.line, 3);
    assert.ok(high.fingerprint);
});

test("Bandit unavailable is reported as SCANNER_UNAVAILABLE without interrupting Semgrep", async () => {
    const unavailable = new Error("bandit not found");
    unavailable.code = "ENOENT";
    const result = await runScanners("fixture", [
        { scanner: "semgrep", type: "SAST", required: true, run: async () => [createSecurityFinding({ title: "semgrep finding" })] },
        { scanner: "Bandit", type: "SAST", isApplicable: async () => true, run: async () => { throw unavailable; } }
    ]);
    assert.equal(result.findings.length, 1);
    assert.equal(result.scannerResults[1].status, "failed");
    assert.equal(result.scannerResults[1].error.code, "SCANNER_UNAVAILABLE");
});

test("Bandit execution errors without JSON are surfaced", async () => {
    await assert.rejects(
        executeBandit("fixture", { execFileFn: (file, args, options, callback) => callback(new Error("Bandit failed"), "", "failure") }),
        /Bandit failed/
    );
});

test("Trivy is skipped for a repository without supported dependency files", async () => {
    const fixture = path.join(__dirname, "fixtures", "dependency-free-repository");
    assert.equal(await hasSupportedDependencyFiles(fixture), false);
    const result = await runScanners(fixture, [{
        scanner: "Trivy",
        type: "SCA",
        isApplicable: hasSupportedDependencyFiles,
        run: async () => { throw new Error("must not run"); }
    }]);
    assert.equal(result.scannerResults[0].status, "skipped");
});

test("Trivy JSON output preserves SCA details and generates a fingerprint", () => {
    const [finding] = normalizeTrivyResults(trivyResult("HIGH").Results);
    assert.equal(finding.scanner, "Trivy");
    assert.equal(finding.type, "SCA");
    assert.equal(finding.cve, "CVE-2024-12345");
    assert.equal(finding.package, "example-package");
    assert.equal(finding.file, "package-lock.json");
    assert.equal(finding.severity, "HIGH");
    assert.match(finding.evidence, /Installed: 1\.0\.0/);
    assert.match(finding.evidence, /Fixed: 1\.0\.1/);
    assert.ok(finding.fingerprint);
});

test("Trivy unavailable does not interrupt Semgrep or Bandit", async () => {
    const unavailable = new Error("trivy not found");
    unavailable.code = "ENOENT";
    const result = await runScanners("fixture", [
        { scanner: "semgrep", type: "SAST", required: true, run: async () => [createSecurityFinding({ title: "semgrep" })] },
        { scanner: "Bandit", type: "SAST", run: async () => [createSecurityFinding({ title: "bandit" })] },
        { scanner: "Trivy", type: "SCA", run: async () => { throw unavailable; } }
    ]);
    assert.equal(result.findings.length, 2);
    assert.equal(result.scannerResults[2].error.code, "SCANNER_UNAVAILABLE");
});

test("Trivy errors without JSON are surfaced", async () => {
    await assert.rejects(
        executeTrivy("fixture", { execFileFn: (file, args, options, callback) => callback(new Error("Trivy failed"), "", "failure") }),
        /Trivy failed/
    );
});

test("Trivy adds offline-scan only when explicitly enabled", () => {
    const { buildTrivyArgs } = require("./src/scanners/trivyScanner");
    assert.deepEqual(
        buildTrivyArgs("fixture", { offlineScan: true }),
        ["fs", "--scanners", "vuln", "--format", "json", "--offline-scan", "fixture"]
    );
    assert.deepEqual(
        buildTrivyArgs("fixture", { offlineScan: false }),
        ["fs", "--scanners", "vuln", "--format", "json", "fixture"]
    );
});

test("Trivy SCA findings can be correlated with another source", () => {
    const other = createSecurityFinding({ scanner: "other", title: "shared", package: "example-package", cve: "CVE-2024-12345" });
    const trivy = createSecurityFinding({ scanner: "Trivy", type: "SCA", title: "shared", package: "example-package", cve: "CVE-2024-12345" });
    const result = correlateFindings([other, trivy]);
    assert.equal(result.uniqueFindingCount, 1);
    assert.deepEqual(result.uniqueFindings[0].detectedBy, ["other", "Trivy"]);
});

test("ZAP JSON alerts normalize to DAST findings with severity, confidence and metadata", () => {
    const [high, medium, low, info] = ["High", "Medium", "Low", "Informational"]
        .map((risk) => normalizeZapResults(zapReport(risk))[0]);
    assert.equal(high.scanner, "OWASP ZAP");
    assert.equal(high.type, "DAST");
    assert.equal(high.severity, "HIGH");
    assert.equal(medium.severity, "MEDIUM");
    assert.equal(low.severity, "LOW");
    assert.equal(info.severity, "INFO");
    assert.equal(high.confidence, 70);
    assert.equal(high.endpoint, "http://localhost:3000/search?q=example");
    assert.equal(high.method, "GET");
    assert.equal(high.metadata.cweId, "79");
    assert.equal(high.metadata.wascId, "8");
    assert.equal(high.metadata.pluginId, "40012");
    assert.ok(high.fingerprint);
});

test("ZAP absent target is skipped with an operational message", async () => {
    const result = await runScanners("fixture", [{
        scanner: "OWASP ZAP",
        type: "DAST",
        isApplicable: async () => ({ applicable: false, code: "TARGET_URL_NOT_PROVIDED", message: "DAST target URL not provided" }),
        run: async () => { throw new Error("must not run"); }
    }]);
    assert.equal(result.scannerResults[0].status, "skipped");
    assert.equal(result.scannerResults[0].error.code, "TARGET_URL_NOT_PROVIDED");
});

test("default ZAP target is localhost while an explicit target keeps priority", () => {
    assert.equal(resolveZapTargetUrl(), "http://localhost:3000");
    assert.equal(resolveZapTargetUrl("http://localhost:8080"), "http://localhost:8080");
});

test("ZAP unavailable does not interrupt SAST or SCA scanners", async () => {
    const unavailable = new Error("zap-baseline.py not found");
    unavailable.code = "ENOENT";
    const result = await runScanners("fixture", [
        { scanner: "semgrep", type: "SAST", required: true, run: async () => [createSecurityFinding({ title: "sast" })] },
        { scanner: "Bandit", type: "SAST", run: async () => [createSecurityFinding({ title: "python" })] },
        { scanner: "Trivy", type: "SCA", run: async () => [createSecurityFinding({ title: "dependency" })] },
        { scanner: "OWASP ZAP", type: "DAST", run: async () => { throw unavailable; } }
    ]);
    assert.equal(result.findings.length, 3);
    assert.equal(result.scannerResults[3].status, "failed");
    assert.equal(result.scannerResults[3].error.code, "SCANNER_UNAVAILABLE");
});

test("ZAP process JSON output is parsed without shell execution", async () => {
    const report = zapReport();
    const output = await executeZap("http://localhost:3000", {
        execFileFn: (command, args, options, callback) => callback(null, JSON.stringify(report), ""),
        command: "zap-baseline.py"
    });
    assert.equal(output.site[0].alerts[0].pluginId, "40012");
});

test("ZAP failures without JSON are surfaced", async () => {
    await assert.rejects(
        executeZap("http://localhost:3000", { execFileFn: (command, args, options, callback) => callback(new Error("ZAP failed"), "", "failure") }),
        /ZAP failed/
    );
});

test("ZAP findings keep triage and work with the Risk Engine", () => {
    const [zapFinding] = normalizeZapResults(zapReport());
    const [triaged] = applyTriage([zapFinding], [{
        fingerprint: zapFinding.fingerprint,
        status: "NEEDS_REVIEW",
        confidence: 70,
        reason: "Validate in test environment"
    }]);
    const correlated = correlateFindings([zapFinding, { ...zapFinding, scanner: "second-dast-source" }]);
    assert.equal(triaged.triageStatus, "NEEDS_REVIEW");
    assert.equal(correlated.uniqueFindingCount, 1);
    assert.doesNotThrow(() => calculateRisk([triaged]));
});

test("Semgrep and Bandit findings with matching fingerprints are correlated", () => {
    const semgrep = createSecurityFinding({ scanner: "semgrep", title: "secret", file: "app.py", line: 1, evidence: "key" });
    const bandit = createSecurityFinding({ scanner: "Bandit", title: "secret", file: "app.py", line: 1, evidence: "key" });
    const result = correlateFindings([semgrep, bandit]);
    assert.equal(result.uniqueFindingCount, 1);
    assert.deepEqual(result.uniqueFindings[0].detectedBy, ["semgrep", "Bandit"]);
});

test("correlation deduplicates by fingerprint while retaining raw findings", () => {
    const one = createSecurityFinding({ scanner: "semgrep", title: "secret", file: "a.js", line: 1, evidence: "key" });
    const two = createSecurityFinding({ scanner: "trivy", title: "secret", file: "a.js", line: 1, evidence: "key" });
    const result = correlateFindings([one, two]);
    assert.equal(result.rawFindingCount, 2);
    assert.equal(result.uniqueFindingCount, 1);
    assert.deepEqual(result.uniqueFindings[0].detectedBy, ["semgrep", "trivy"]);
    assert.equal(result.uniqueFindings[0].occurrenceCount, 2);
});

test("optional scanner failure is reported without interrupting the run", async () => {
    const result = await runScanners("fixture", [
        { name: "ok", required: true, run: async () => [createSecurityFinding({ title: "one" })] },
        { name: "optional", required: false, run: async () => { throw new Error("unavailable"); } }
    ]);
    assert.equal(result.findings.length, 1);
    assert.equal(result.scannerResults[0].scanner, "ok");
    assert.equal(result.scannerResults[0].status, "completed");
    assert.equal(result.scannerResults[0].findingCount, 1);
    assert.ok(result.scannerResults[0].durationMs >= 0);
    assert.equal(result.scannerResults[1].status, "failed");
    assert.equal(result.scannerResults[1].error.code, "SCANNER_FAILED");
});

test("unavailable optional scanner is distinguished from a scanner failure", async () => {
    const unavailable = new Error("semgrep not found");
    unavailable.code = "ENOENT";
    const result = await runScanners("fixture", [{
        scanner: "optional-tool",
        type: "SAST",
        run: async () => { throw unavailable; }
    }]);
    assert.equal(result.scannerResults[0].status, "failed");
    assert.equal(result.scannerResults[0].error.code, "SCANNER_UNAVAILABLE");
});

test("scanner ignored as not applicable is reported as skipped", async () => {
    const result = await runScanners("fixture", [{
        scanner: "python-only",
        type: "SAST",
        isApplicable: async () => false,
        run: async () => { throw new Error("must not run"); }
    }]);
    assert.equal(result.scannerResults[0].status, "skipped");
    assert.equal(result.scannerResults[0].findingCount, 0);
    assert.equal(result.scannerResults[0].error, null);
});

test("analyze flow returns raw and unique findings without changing legacy fields", async () => {
    const finding = createSecurityFinding({ scanner: "semgrep", title: "sql injection", file: "fixture/auth.js", line: 3, severity: "HIGH" });
    const fixtureRepository = path.join(__dirname, "fixtures", "small-repository");
    const savedFindings = [];
    const persistedTriage = [{ fingerprint: finding.fingerprint, status: "FALSE_POSITIVE", confidence: 100, reason: "Reviewed" }];
    const handler = createAnalyzeHandler({
        cloneRepository: async () => fixtureRepository,
        runDefaultScanners: async () => ({ findings: [finding, { ...finding, scanner: "second-scanner" }], scanners: [{ name: "semgrep", status: "completed", required: true }] }),
        generateSecurityAdvice: async () => ({ success: true, data: { findingsAnalyzed: 1 } }),
        getRepositoryByUrl: async () => null,
        createRepository: async () => 9,
        createScan: async () => 10,
        saveMany: async (scanId, storedFindings) => savedFindings.push(...storedFindings),
        getTriageByFingerprints: async () => persistedTriage,
        correlateFindingsWithHistory: async () => [],
        correlateFindingWithHistory: async () => ({ status: "skipped" }),
        removeRepository: async (repositoryPath) => assert.equal(repositoryPath, fixtureRepository)
    });
    assert.equal(fs.existsSync(path.join(fixtureRepository, "vulnerable.js")), true);
    const response = { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ body: { repoUrl: "https://example.test/small-fixture-repository.git" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.totalFindings, 1);
    assert.equal(response.body.rawFindingCount, 2);
    assert.equal(response.body.uniqueFindingCount, 1);
    assert.equal(response.body.findings[0].occurrenceCount, 2);
    assert.equal(response.body.findings[0].triageStatus, "FALSE_POSITIVE");
    assert.equal(response.body.rawFindings[0].triageReason, "Reviewed");
    assert.equal(savedFindings.length, 1);
    assert.equal(savedFindings[0].triageStatus, "FALSE_POSITIVE");
});

function historicalCandidate(overrides = {}) {
    return {
        findingId: 1, fingerprint: "historic-fingerprint", scanner: "Semgrep", type: "SAST",
        severity: "HIGH", rule: "rule.sql", cwe: "89", cve: null, file: "src/auth.js",
        url: null, method: null, package: null, normalizedMessage: "unsafe query",
        triageStatus: null, triageReason: null, occurrenceCount: 1, ...overrides
    };
}

test("historical correlation returns no candidates when there is no history", async () => {
    const service = createHistoricalCorrelationService({ findCandidates: async () => [] });
    const result = await service.correlateFindingWithHistory(createSecurityFinding({ title: "unsafe query" }));
    assert.deepEqual(result.historicalMatches, []);
});

test("historical correlation prioritizes an identical fingerprint", async () => {
    const finding = createSecurityFinding({ scanner: "Semgrep", title: "unsafe query", file: "src/auth.js", ruleId: "rule.sql" });
    const service = createHistoricalCorrelationService({ findCandidates: async () => [historicalCandidate({ fingerprint: finding.fingerprint })] });
    const result = await service.correlateFindingWithHistory(finding);
    assert.equal(result.historicalMatches[0].similarityScore >= 100, true);
});

test("historical correlation scores rule and CWE candidates", async () => {
    const finding = createSecurityFinding({ title: "different message", ruleId: "rule.sql", metadata: { cweId: "89" } });
    const service = createHistoricalCorrelationService({ findCandidates: async () => [historicalCandidate()] });
    const result = await service.correlateFindingWithHistory(finding);
    assert.equal(result.historicalMatches[0].similarityScore, 60);
});

test("historical candidates are sorted and capped by configured limit", async () => {
    const finding = createSecurityFinding({ title: "unsafe query", ruleId: "rule.sql" });
    const service = createHistoricalCorrelationService({ findCandidates: async () => [
        historicalCandidate({ findingId: 1, rule: "other" }), historicalCandidate({ findingId: 2 })
    ] });
    const result = await service.correlateFindingWithHistory(finding, { limit: 1 });
    assert.equal(result.historicalMatches.length, 1);
    assert.equal(result.historicalMatches[0].findingId, 2);
});

test("historical candidates retain existing triage and leave absent triage null", async () => {
    const service = createHistoricalCorrelationService({ findCandidates: async () => [
        historicalCandidate({ triageStatus: "CONFIRMED", triageReason: "Reviewed" }), historicalCandidate({ findingId: 2 })
    ] });
    const result = await service.correlateFindingWithHistory(createSecurityFinding({ title: "unsafe query" }));
    assert.equal(result.historicalMatches.find((match) => match.findingId === 1).triageStatus, "CONFIRMED");
    assert.equal(result.historicalMatches.find((match) => match.findingId === 2).triageStatus, null);
});

test("AI correlation is skipped without ambiguous relevant candidates", async () => {
    const service = createAiCorrelationService({ client: { chat: async () => { throw new Error("must not call"); } } });
    const result = await service.correlateFindingWithHistory({ finding: createSecurityFinding({ title: "x" }), historicalMatches: [] });
    assert.equal(result.status, "skipped");
});

test("AI correlation returns unavailable when Ollama is unavailable", async () => {
    const service = createAiCorrelationService({ client: { chat: async () => { throw new Error("Ollama unavailable"); } } });
    const result = await service.correlateFindingWithHistory({ finding: createSecurityFinding({ title: "x" }), historicalMatches: [historicalCandidate({ similarityScore: 40 })] });
    assert.equal(result.status, "unavailable");
});

test("AI correlation returns unavailable on timeout", async () => {
    const service = createAiCorrelationService({ client: { chat: () => new Promise(() => {}) }, timeoutMs: 1 });
    const result = await service.correlateFindingWithHistory({ finding: createSecurityFinding({ title: "x" }), historicalMatches: [historicalCandidate({ similarityScore: 40 })] });
    assert.equal(result.code, "AI_CORRELATION_TIMEOUT");
});

test("AI correlation rejects invalid model JSON safely", async () => {
    const service = createAiCorrelationService({ client: { chat: async () => ({ message: { content: "not json" } }) } });
    const result = await service.correlateFindingWithHistory({ finding: createSecurityFinding({ title: "x" }), historicalMatches: [historicalCandidate({ similarityScore: 40 })] });
    assert.equal(result.status, "unavailable");
});

test("AI correlation returns a valid non-binding suggestion", async () => {
    const service = createAiCorrelationService({ client: { chat: async () => ({ message: { content: '{"correlated":true,"confidence":0.8,"relatedFindings":[1],"reason":"same CWE","signals":["CWE"]}' } }) } });
    const result = await service.correlateFindingWithHistory({ finding: createSecurityFinding({ title: "x" }), historicalMatches: [historicalCandidate({ similarityScore: 40 })] });
    assert.equal(result.status, "completed");
    assert.equal(result.correlated, true);
    assert.deepEqual(result.relatedFindings, [1]);
});

test("analysis exposes additive historical and AI correlation without changing legacy results", async () => {
    const finding = createSecurityFinding({ title: "sql injection", severity: "HIGH", file: "src/auth.js" });
    const handler = createAnalyzeHandler({
        cloneRepository: async () => "fixture", runDefaultScanners: async () => ({ findings: [finding], scanners: [], scannerResults: [] }),
        correlateFindingsWithHistory: async () => [{ finding, historicalMatches: [historicalCandidate({ similarityScore: 40 })] }],
        correlateFindingWithHistory: async () => ({ status: "completed", correlated: false, confidence: 0.2, relatedFindings: [], reason: "different", signals: [] }),
        getTriageByFingerprints: async () => [], generateSecurityAdvice: async () => ({ success: true }),
        getRepositoryByUrl: async () => ({ id: 1 }), createScan: async () => 1, saveMany: async () => {}, removeRepository: async () => {}
    });
    const response = { status() { return this; }, json(body) { this.body = body; } };
    await handler({ body: { repoUrl: "https://example.test/repo.git" } }, response);
    assert.equal(response.body.totalFindings, 1);
    assert.equal(response.body.historicalCorrelation.status, "completed");
    assert.equal(response.body.historicalCorrelation.matches.length, 1);
    assert.equal(response.body.aiCorrelation.status, "completed");
    assert.equal(response.body.aiCorrelation.matches[0].status, "completed");
    for (const field of ["success", "scanId", "riskScore", "riskLevel", "findings", "totalFindings", "topRisks", "aiAdvisor", "rawFindings", "uniqueFindings", "rawFindingCount", "uniqueFindingCount", "scannerResults"]) {
        assert.ok(field in response.body, `legacy field ${field} is present`);
    }
    assert.equal(calculateRisk(response.body.findings), 45);
});

test("analysis remains successful when historical or AI correlation is unavailable", async () => {
    const finding = createSecurityFinding({ title: "sql injection", severity: "HIGH", file: "src/auth.js" });
    const handler = createAnalyzeHandler({
        cloneRepository: async () => "fixture", runDefaultScanners: async () => ({ findings: [finding], scanners: [], scannerResults: [] }),
        correlateFindingsWithHistory: async () => { throw new Error("SQLite unavailable"); },
        correlateFindingWithHistory: async () => { throw new Error("Ollama unavailable"); },
        getTriageByFingerprints: async () => [], generateSecurityAdvice: async () => ({ success: true }),
        getRepositoryByUrl: async () => ({ id: 1 }), createScan: async () => 1, saveMany: async () => {}, removeRepository: async () => {}
    });
    const response = { statusCode: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    await handler({ body: { repoUrl: "https://example.test/repo.git" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.historicalCorrelation.status, "unavailable");
    assert.equal(response.body.aiCorrelation.status, "skipped");
    assert.equal(response.body.totalFindings, 1);
    assert.equal(response.body.riskScore, 45);
});

test("AI Advisor failure does not discard a completed technical analysis", async () => {
    const finding = createSecurityFinding({ title: "sql injection", severity: "HIGH", file: "src/auth.js" });
    const handler = createAnalyzeHandler({
        cloneRepository: async () => "fixture", runDefaultScanners: async () => ({ findings: [finding], scanners: [], scannerResults: [] }),
        correlateFindingsWithHistory: async () => [], correlateFindingWithHistory: async () => ({ status: "skipped" }),
        getTriageByFingerprints: async () => [], generateSecurityAdvice: async () => { throw new Error("Ollama unavailable"); },
        getRepositoryByUrl: async () => ({ id: 1 }), createScan: async () => 1, saveMany: async () => {}, removeRepository: async () => {}
    });
    const response = { statusCode: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    await handler({ body: { repoUrl: "https://example.test/repo.git" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.aiAdvisor.success, false);
    assert.equal(response.body.historicalCorrelation.status, "no_matches");
    assert.equal(response.body.aiCorrelation.status, "skipped");
    assert.equal(response.body.totalFindings, 1);
});
