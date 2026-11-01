# Historical Correlation

The AegisAI pipeline retains deterministic correlation as its source of truth:

`scanners → normalization → deterministic correlation → historical correlation → optional AI correlation → triage → risk engine → AI advisor`

Deterministic correlation groups current scanner output by fingerprint. Historical correlation performs a bounded SQLite lookup for prior normalized findings using fingerprint, rule, CWE/CVE, file, endpoint, package and normalized message, then ranks those candidates with a deterministic similarity score.

AI correlation receives only the current finding and the already selected candidates. It returns a non-binding suggestion and is skipped when no ambiguous relevant candidates exist. An unavailable model, timeout, or invalid JSON returns `status: "unavailable"`; it never changes triage, severity, risk, persistence, or the deterministic result.

`HISTORICAL_CORRELATION_LIMIT` defaults to `20` (maximum `100`). `OLLAMA_CORRELATION_MODEL` falls back to the configured advisor model, and `OLLAMA_CORRELATION_TIMEOUT` defaults to `10000` milliseconds.
