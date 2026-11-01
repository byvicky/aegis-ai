const { normalizeSemgrepResults } = require("../engines/normalizationEngine");

// Compatibility adapter for callers that still pass Semgrep's raw result array.
function normalizeFindings(results) {
    return normalizeSemgrepResults(results);
}

module.exports = {
    normalizeFindings
};
