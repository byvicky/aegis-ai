function calculateRisk(findings) {

    let score = 0;

    findings.forEach(finding => {

        score += getSeverityScore(
            finding.severity
        );

        score += getCategoryScore(
            finding.title
        );

        score += getCriticalFileScore(
            finding.file
        );

    });

    score += getVolumeScore(
        findings.length
    );

    return score;
}

function getSeverityScore(severity) {

    switch (severity) {

        case "CRITICAL":
        case "HIGH":
        case "ERROR":
            return 10;

        case "MEDIUM":
        case "WARNING":
            return 5;

        case "INFO":
            return 1;

        default:
            return 1;
    }
}

function getCategoryScore(title) {

    const text =
        String(title || "").toLowerCase();

    if (text.includes("sql"))
        return 20;

    if (text.includes("command"))
        return 20;

    if (text.includes("secret"))
        return 18;

    if (text.includes("auth"))
        return 15;

    if (text.includes("xss"))
        return 12;

    if (text.includes("path"))
        return 15;

    return 0;
}

function getCriticalFileScore(file) {

    const path =
        String(file || "").toLowerCase();

    const criticalWords = [
        "auth",
        "login",
        "jwt",
        "token",
        "payment",
        "admin"
    ];

    for (const word of criticalWords) {

        if (path.includes(word)) {
            return 15;
        }

    }

    return 0;
}

function getVolumeScore(totalFindings) {

    if (totalFindings >= 50)
        return 40;

    if (totalFindings >= 20)
        return 20;

    if (totalFindings >= 10)
        return 10;

    return 0;
}

function getRiskLevel(score) {

    if (score < 50)
        return "LOW";

    if (score < 100)
        return "MEDIUM";

    if (score < 200)
        return "HIGH";

    return "CRITICAL";
}

function getTopRisks(findings) {

    const risks = [];

    findings.forEach(finding => {

        let riskScore = 0;

        riskScore += getSeverityScore(
            finding.severity
        );

        riskScore += getCategoryScore(
            finding.title
        );

        riskScore += getCriticalFileScore(
            finding.file
        );

        risks.push({
            title: finding.title,
            file: finding.file,
            severity: finding.severity,
            score: riskScore
        });

    });

    risks.sort((a, b) => b.score - a.score);

    return risks.slice(0, 5);
}

module.exports = {
    calculateRisk,
    getRiskLevel,
    getTopRisks
};
