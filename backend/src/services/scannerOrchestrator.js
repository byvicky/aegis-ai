const { runSemgrepScanner } = require("../scanners/semgrepScanner");
const { hasPythonFiles, runBanditScanner } = require("../scanners/banditScanner");
const { hasSupportedDependencyFiles, runTrivyScanner } = require("../scanners/trivyScanner");
const { runZapScanner } = require("../scanners/zapScanner");

async function runScanners(repositoryPath, scanners) {
    const results = await Promise.all(scanners.map(async (scanner) => {
        const startedAt = Date.now();
        const result = {
            scanner: scanner.scanner || scanner.name,
            type: scanner.type || "SAST",
            status: "pending",
            durationMs: 0,
            findingCount: 0,
            findings: [],
            error: null
        };

        try {
            const applicability = scanner.isApplicable && await scanner.isApplicable(repositoryPath);
            if (scanner.isApplicable && (applicability === false || applicability?.applicable === false)) {
                result.status = "skipped";
                if (typeof applicability === "object" && applicability.message) {
                    result.error = { code: applicability.code || "SCANNER_SKIPPED", message: applicability.message };
                }
                return result;
            }

            result.status = "running";
            const findings = await scanner.run(repositoryPath);
            if (!Array.isArray(findings)) throw new Error(`Scanner ${result.scanner} must return SecurityFinding[].`);

            result.status = "completed";
            result.findings = findings;
            result.findingCount = findings.length;
            return result;
        } catch (error) {
            result.status = "failed";
            result.error = {
                code: error.code === "ENOENT" ? "SCANNER_UNAVAILABLE" : "SCANNER_FAILED",
                message: error.message
            };

            if (scanner.required) {
                const requiredError = new Error(`Required scanner ${result.scanner} failed: ${error.message}`);
                requiredError.scannerResult = result;
                throw requiredError;
            }

            return result;
        } finally {
            result.durationMs = Date.now() - startedAt;
        }
    }));

    return {
        findings: results.flatMap((result) => result.findings),
        scannerResults: results,
        scanners: results.map(({ findings, ...status }) => status)
    };
}

function resolveZapTargetUrl(targetUrl) {
    return targetUrl || process.env.ZAP_DEFAULT_TARGET_URL || "http://localhost:3000";
}

function runDefaultScanners(repositoryPath, { targetUrl } = {}) {
    const zapTargetUrl = resolveZapTargetUrl(targetUrl);

    return runScanners(repositoryPath, [
        { scanner: "semgrep", type: "SAST", required: true, run: runSemgrepScanner },
        {
            scanner: "Bandit",
            type: "SAST",
            required: false,
            isApplicable: hasPythonFiles,
            run: runBanditScanner
        },
        {
            scanner: "Trivy",
            type: "SCA",
            required: false,
            isApplicable: hasSupportedDependencyFiles,
            run: runTrivyScanner
        },
        {
            scanner: "OWASP ZAP",
            type: "DAST",
            required: false,
            isApplicable: async () => zapTargetUrl
                ? { applicable: true }
                : { applicable: false, code: "TARGET_URL_NOT_PROVIDED", message: "DAST target URL not provided" },
            run: () => runZapScanner(zapTargetUrl)
        }
    ]);
}

module.exports = { runScanners, runDefaultScanners, resolveZapTargetUrl };
