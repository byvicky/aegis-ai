const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { createSecurityFinding } = require("../models/securityFinding");

const DEPENDENCY_FILES = new Set([
    "package-lock.json", "package.json", "requirements.txt", "poetry.lock",
    "pom.xml", "build.gradle", "build.gradle.kts"
]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "venv", ".venv", "__pycache__"]);
const CONFIDENCE_MAP = { CRITICAL: 95, HIGH: 90, MEDIUM: 70, LOW: 50 };

async function hasSupportedDependencyFiles(repositoryPath) {
    const entries = await fs.readdir(repositoryPath, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(repositoryPath, entry.name);
        if (entry.isFile() && DEPENDENCY_FILES.has(entry.name)) return true;
        if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) {
            if (await hasSupportedDependencyFiles(entryPath)) return true;
        }
    }

    return false;
}

function normalizeTrivySeverity(severity) {
    const normalized = String(severity || "INFO").toUpperCase();
    return ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].includes(normalized) ? normalized : "INFO";
}

function normalizeTrivyVulnerability(vulnerability, target) {
    const severity = normalizeTrivySeverity(vulnerability.Severity);
    const cve = vulnerability.VulnerabilityID;
    const packageName = vulnerability.PkgName;
    const installedVersion = vulnerability.InstalledVersion;
    const fixedVersion = vulnerability.FixedVersion;
    const title = vulnerability.Title || `${cve || "Vulnerability"} in ${packageName || "dependency"}`;
    const versionEvidence = [
        packageName && `Package: ${packageName}`,
        installedVersion && `Installed: ${installedVersion}`,
        fixedVersion && `Fixed: ${fixedVersion}`
    ].filter(Boolean).join("; ");

    return createSecurityFinding({
        source: "trivy",
        scanner: "Trivy",
        type: "SCA",
        title,
        description: vulnerability.Description,
        severity,
        confidence: CONFIDENCE_MAP[severity] ?? null,
        file: target,
        package: packageName,
        cve,
        evidence: versionEvidence,
        recommendation: fixedVersion ? `Upgrade ${packageName} to ${fixedVersion}.` : undefined
    });
}

function normalizeTrivyResults(results) {
    if (!Array.isArray(results)) return [];

    return results.flatMap((result) =>
        Array.isArray(result.Vulnerabilities)
            ? result.Vulnerabilities.map((vulnerability) => normalizeTrivyVulnerability(vulnerability, result.Target))
            : []
    );
}

function isOfflineScanEnabled(value = process.env.TRIVY_OFFLINE_SCAN) {
    return String(value || "").trim().toLowerCase() === "true";
}

function buildTrivyArgs(repositoryPath, { offlineScan } = {}) {
    const args = ["fs", "--scanners", "vuln", "--format", "json"];

    if (isOfflineScanEnabled(offlineScan)) {
        args.push("--offline-scan");
    }

    args.push(repositoryPath);
    return args;
}

function executeTrivy(repositoryPath, { execFileFn = execFile, timeoutMs = 180000, offlineScan } = {}) {
    return new Promise((resolve, reject) => {
        execFileFn("trivy", buildTrivyArgs(repositoryPath, { offlineScan }), {
            timeout: timeoutMs,
            maxBuffer: 1024 * 1024 * 50
        }, (error, stdout, stderr) => {
            if (!stdout) {
                const executionError = error || new Error("Trivy returned no output.");
                executionError.stderr = stderr;
                return reject(executionError);
            }

            try {
                resolve(JSON.parse(stdout));
            } catch (parseError) {
                parseError.stderr = stderr;
                reject(parseError);
            }
        });
    });
}

async function runTrivyScanner(repositoryPath, options) {
    const rawResult = await executeTrivy(repositoryPath, options);
    return normalizeTrivyResults(rawResult.Results);
}

module.exports = {
    hasSupportedDependencyFiles,
    normalizeTrivySeverity,
    normalizeTrivyVulnerability,
    normalizeTrivyResults,
    isOfflineScanEnabled,
    buildTrivyArgs,
    executeTrivy,
    runTrivyScanner
};
