const crypto = require("crypto");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { createSecurityFinding } = require("../models/securityFinding");

const RISK_MAP = { HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW", INFORMATIONAL: "INFO", INFO: "INFO" };
const CONFIDENCE_MAP = { HIGH: 90, MEDIUM: 70, LOW: 50, CONFIRMED: 100 };

function normalizeZapSeverity(risk) {
    return RISK_MAP[String(risk || "INFO").toUpperCase()] || "INFO";
}

function normalizeZapConfidence(confidence) {
    return CONFIDENCE_MAP[String(confidence || "").toUpperCase()] ?? null;
}

function normalizeEndpoint(url) {
    try {
        const parsed = new URL(url);
        const parameterNames = [...new Set([...parsed.searchParams.keys()])].sort();
        return `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${parsed.pathname}${parameterNames.length ? `?${parameterNames.join("&")}` : ""}`;
    } catch {
        return url || "";
    }
}

function createZapFingerprint(alert) {
    const identity = [
        "OWASP ZAP",
        alert.pluginId || alert.pluginid || alert.id || "",
        alert.method || "",
        normalizeEndpoint(alert.url),
        alert.param || "",
        String(alert.evidence || "").trim()
    ].join("|");

    return crypto.createHash("sha256").update(identity).digest("hex");
}

function normalizeZapAlert(alert) {
    const pluginId = alert.pluginId || alert.pluginid || alert.id;
    const title = alert.alert || alert.name || "OWASP ZAP alert";

    return createSecurityFinding({
        source: "zap",
        scanner: "OWASP ZAP",
        type: "DAST",
        title,
        ruleId: pluginId ? String(pluginId) : undefined,
        description: alert.description,
        severity: normalizeZapSeverity(alert.risk || alert.riskdesc),
        confidence: normalizeZapConfidence(alert.confidence),
        endpoint: alert.url,
        method: alert.method,
        evidence: alert.evidence,
        recommendation: alert.solution,
        fingerprint: createZapFingerprint(alert),
        metadata: {
            cweId: alert.cweid || alert.cweId,
            wascId: alert.wascid || alert.wascId,
            pluginId: pluginId ? String(pluginId) : undefined,
            parameter: alert.param,
            reference: alert.reference
        }
    });
}

function extractZapAlerts(report) {
    if (Array.isArray(report)) return report;
    if (Array.isArray(report?.alerts)) return report.alerts;
    const sites = report?.site || report?.sites || [];
    return (Array.isArray(sites) ? sites : [sites]).flatMap((site) => site?.alerts || []);
}

function normalizeZapResults(report) {
    return extractZapAlerts(report).map(normalizeZapAlert);
}

function getZapCommand() {
    return process.env.ZAP_COMMAND || process.env.ZAP_PATH || "zap-baseline.py";
}

function getZapTimeout() {
    const configured = Number(process.env.ZAP_TIMEOUT);
    return Number.isFinite(configured) && configured > 0 ? configured : 300000;
}

async function executeZap(targetUrl, { execFileFn = execFile, filesystem = fs, tempDirectory = os.tmpdir(), command = getZapCommand(), timeoutMs = getZapTimeout() } = {}) {
    const reportDirectory = await filesystem.mkdtemp(path.join(tempDirectory, "aegis-zap-"));
    const reportPath = path.join(reportDirectory, "report.json");

    return new Promise((resolve, reject) => {
        execFileFn(command, ["-t", targetUrl, "-J", reportPath], { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
            try {
                // A ZAP baseline scan can return a non-zero code for alerts; a JSON report remains successful output.
                const output = stdout?.trim() || await filesystem.readFile(reportPath, "utf8");
                resolve(JSON.parse(output));
            } catch (parseError) {
                const executionError = error || parseError;
                executionError.stderr = stderr;
                reject(executionError);
            } finally {
                await filesystem.rm(reportDirectory, { recursive: true, force: true });
            }
        });
    });
}

async function runZapScanner(targetUrl, options) {
    const report = await executeZap(targetUrl, options);
    return normalizeZapResults(report);
}

module.exports = {
    normalizeZapSeverity,
    normalizeZapConfidence,
    normalizeEndpoint,
    createZapFingerprint,
    normalizeZapAlert,
    normalizeZapResults,
    executeZap,
    runZapScanner
};
