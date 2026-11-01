import type { ScannerResult, ScannerStatus } from "@/api/analyze";

export const SUPPORTED_SCANNERS = [
  { scanner: "Semgrep", type: "SAST" },
  { scanner: "Bandit", type: "SAST" },
  { scanner: "Trivy", type: "SCA" },
  { scanner: "OWASP ZAP", type: "DAST" },
] as const;

function errorCode(error: ScannerResult["error"]) {
  return typeof error === "object" && error ? error.code : undefined;
}

function configuredScanner(name?: string) {
  const normalized = String(name || "").trim().toLowerCase();
  return SUPPORTED_SCANNERS.find((scanner) => scanner.scanner.toLowerCase() === normalized || (normalized === "semgrep" && scanner.scanner === "Semgrep"));
}

export function normalizeScannerStatus(scanner: ScannerResult): ScannerStatus {
  if (scanner.status === "failed" && errorCode(scanner.error) === "SCANNER_UNAVAILABLE") return "unavailable";
  return scanner.status || "pending";
}

export function normalizeScannerResults(scanners?: ScannerResult[]): ScannerResult[] {
  return (scanners || []).map((scanner) => {
    const configured = configuredScanner(scanner.scanner);
    return {
      ...scanner,
      scanner: configured?.scanner || scanner.scanner || "Scanner",
      type: configured?.type || scanner.type || "SAST",
      status: normalizeScannerStatus(scanner),
      findingCount: scanner.findingCount ?? scanner.findings?.length ?? 0,
      findings: scanner.findings || [],
      error: scanner.error ?? null,
    };
  });
}

export function unavailableConfiguredScanners(message: string): ScannerResult[] {
  return SUPPORTED_SCANNERS.map((scanner) => ({
    ...scanner,
    status: "unavailable",
    findingCount: 0,
    findings: [],
    error: { code: "SCANNER_STATUS_UNAVAILABLE", message },
  }));
}
