const fs = require("fs");
const path = require("path");

function loadAiAdvisorConfig() {
    const envPath = path.resolve(__dirname, "../../.env");

    if (!fs.existsSync(envPath)) {
        return;
    }

    const values = {};
    const supportedKeys = ["OLLAMA_MODEL", "TRIVY_OFFLINE_SCAN"];

    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const match = line.match(/^\s*(OLLAMA_MODEL|TRIVY_OFFLINE_SCAN)\s*=\s*(.*?)\s*$/);
        if (match) {
            values[match[1]] = match[2].replace(/^("|')|("|')$/g, "");
        }
    }

    const configuredModel = values.OLLAMA_MODEL;

    // The project configuration deliberately takes precedence over an inherited
    // process value, preventing a stale shell setting from changing the model.
    if (configuredModel) {
        process.env.OLLAMA_MODEL = configuredModel;
    }

    if (values.TRIVY_OFFLINE_SCAN) {
        process.env.TRIVY_OFFLINE_SCAN = values.TRIVY_OFFLINE_SCAN;
    }
}

module.exports = { loadAiAdvisorConfig };
