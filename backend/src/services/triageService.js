function applyTriage(findings, triageRecords = []) {
    const byFingerprint = new Map(
        triageRecords.filter((record) => record?.fingerprint).map((record) => [record.fingerprint, record])
    );

    return (findings || []).map((finding) => {
        const triage = byFingerprint.get(finding.fingerprint);

        return {
            ...finding,
            confidence: triage?.confidence ?? finding.confidence ?? null,
            triageStatus: triage?.status || finding.triageStatus || "NEW",
            triageReason: triage?.reason ?? finding.triageReason ?? null
        };
    });
}

module.exports = { applyTriage };
