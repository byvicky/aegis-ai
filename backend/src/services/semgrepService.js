const { executeSemgrep } = require("../scanners/semgrepScanner");

// Kept for backwards compatibility while callers migrate to semgrepScanner.
async function runSemgrep(repoPath) {
    return executeSemgrep(repoPath);
}

module.exports = {
    runSemgrep
};
