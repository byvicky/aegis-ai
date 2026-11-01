const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { createSecurityFinding } = require("../models/securityFinding");

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "venv", ".venv", "__pycache__"]);
const CONFIDENCE_MAP = { HIGH: 90, MEDIUM: 70, LOW: 50 };

async function hasPythonFiles(repositoryPath) {
    const entries = await fs.readdir(repositoryPath, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(repositoryPath, entry.name);
        if (entry.isFile() && entry.name.toLowerCase().endsWith(".py")) return true;
        if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) {
            if (await hasPythonFiles(entryPath)) return true;
        }
    }

    return false;
}

function normalizeBanditSeverity(severity) {
    const normalized = String(severity || "INFO").toUpperCase();
    return ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].includes(normalized) ? normalized : "INFO";
}

function normalizeBanditFinding(issue) {
    const rule = issue.test_id || issue.test_name || "Bandit finding";
    const title = issue.test_name ? `${issue.test_name} (${rule})` : rule;

    return createSecurityFinding({
        source: "bandit",
        scanner: "Bandit",
        type: "SAST",
        title,
        description: issue.issue_text,
        severity: normalizeBanditSeverity(issue.issue_severity),
        confidence: CONFIDENCE_MAP[String(issue.issue_confidence || "").toUpperCase()] ?? null,
        file: issue.filename,
        line: issue.line_number,
        evidence: issue.code,
        recommendation: issue.more_info
    });
}

function normalizeBanditResults(results) {
    return Array.isArray(results) ? results.map(normalizeBanditFinding) : [];
}

function executeBandit(repositoryPath, { execFileFn = execFile, timeoutMs = 120000 } = {}) {
    return new Promise((resolve, reject) => {
        execFileFn("bandit", ["-r", repositoryPath, "-f", "json"], {
            timeout: timeoutMs,
            maxBuffer: 1024 * 1024 * 50
        }, (error, stdout, stderr) => {
            // Bandit exits with code 1 when findings exist but still emits valid JSON.
            if (!stdout) {
                const executionError = error || new Error("Bandit returned no output.");
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

async function runBanditScanner(repositoryPath, options) {
    const rawResult = await executeBandit(repositoryPath, options);
    return normalizeBanditResults(rawResult.results);
}

module.exports = {
    hasPythonFiles,
    normalizeBanditSeverity,
    normalizeBanditFinding,
    normalizeBanditResults,
    executeBandit,
    runBanditScanner
};
