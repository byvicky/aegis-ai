const { execFile } = require("child_process");
const { normalizeSemgrepResults } = require("../engines/normalizationEngine");

function executeSemgrep(repositoryPath, { execFileFn = execFile } = {}) {
    return new Promise((resolve, reject) => {
        execFileFn("semgrep", ["scan", "--config", "auto", "--json", repositoryPath], { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            // Semgrep may use a non-zero exit code when it finds findings; valid JSON still represents success.
            if (!stdout) {
                const executionError = error || new Error("Semgrep returned no output.");
                executionError.stderr = stderr;
                return reject(executionError);
            }
            try { resolve(JSON.parse(stdout)); }
            catch (parseError) { parseError.stderr = stderr; reject(parseError); }
        });
    });
}

async function runSemgrepScanner(repositoryPath) {
    const rawResult = await executeSemgrep(repositoryPath);
    return normalizeSemgrepResults(rawResult.results);
}

module.exports = { executeSemgrep, runSemgrepScanner };
