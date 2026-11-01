import { api } from "./client";

export interface Risk {
  title: string;
  file: string;
  severity: string;
  score: number;
}

export interface Finding extends Risk {
  id?: string;
  source?: string;
  scanner?: string;
  type?: "SAST" | "SCA" | "DAST" | "SECRETS" | "IA" | string;
  description?: string;
  confidence?: number;
  owaspCategory?: string;
  line?: number;
  message?: string;
  evidence?: string;
  package?: string;
  cve?: string;
  ruleId?: string;
  endpoint?: string;
  method?: string;
  installedVersion?: string;
  fixedVersion?: string;
  recommendation?: string;
  fingerprint?: string;
  detectedBy?: string[];
  occurrenceCount?: number;
}

export type ScannerStatus =
  | "pending"
  | "running"
  | "completed"
  | "skipped"
  | "failed"
  | "unavailable";

export interface ScannerError {
  code?: string;
  message?: string;
}

export interface ScannerResult {
  scanner: string;
  type: "SAST" | "SCA" | "DAST" | "SECRETS" | "IA" | string;
  status: ScannerStatus;
  durationMs?: number;
  findingCount?: number;
  findings?: Finding[];
  error?: ScannerError | string | null;
}

export interface AIRisk {
  title: string;
  explanation: string;
  severity: string;
  priority: string;
}

export interface AIAdvisorData {
  summary: string;
  riskLevel: string;
  priority: string;
  keyRisks: AIRisk[];
  recommendations: string[];
  findingsAnalyzed: number;
}

export interface AIAdvisorResponse {
  success: boolean;
  data?: AIAdvisorData;
  error?: string;
}

export interface HistoricalMatch {
  findingId?: number | string;
  currentFingerprint?: string | null;
  fingerprint?: string;
  scanner?: string;
  type?: string;
  severity?: string;
  rule?: string;
  cwe?: string;
  cve?: string;
  file?: string;
  url?: string;
  package?: string;
  firstSeen?: string;
  lastSeen?: string;
  occurrenceCount?: number;
  triageStatus?: string | null;
  triageReason?: string | null;
  similarityScore?: number;
}

export interface HistoricalCorrelationEntry {
  finding?: Finding;
  historicalMatches?: HistoricalMatch[];
  status?: "unavailable";
  error?: ScannerError | null;
}

export interface HistoricalCorrelationResponse {
  status: "completed" | "no_matches" | "unavailable";
  matches: HistoricalMatch[];
  entries?: HistoricalCorrelationEntry[];
  error?: ScannerError | null;
}

export interface AICorrelationMatch {
  fingerprint?: string | null;
  status: "completed" | "skipped" | "unavailable";
  correlated?: boolean;
  confidence?: number;
  relatedFindings?: Array<number | string>;
  reason?: string;
  signals?: string[];
  code?: string;
}

export interface AICorrelationResponse {
  status: "completed" | "skipped" | "unavailable";
  matches: AICorrelationMatch[];
  error?: ScannerError | null;
}

export interface AnalyzeResponse {
  success: boolean;

  repositoryPath?: string;

  scanId?: number;

  repositoryId?: number;

  riskScore?: number;

  riskLevel?: string;

  totalFindings?: number;

  topRisks?: Risk[];

  findings?: Finding[];

  aiAdvisor?: AIAdvisorResponse;
  scannerResults?: ScannerResult[];
  scanners?: ScannerResult[];
  rawFindings?: Finding[];
  uniqueFindings?: Finding[];
  rawFindingCount?: number;
  uniqueFindingCount?: number;

  historicalCorrelation?: HistoricalCorrelationResponse | HistoricalCorrelationEntry[];
  aiCorrelation?: AICorrelationResponse | AICorrelationMatch[];
}

export async function analyzeRepository(
  repoUrl: string
): Promise<AnalyzeResponse> {

  const response =
    await api.post<AnalyzeResponse>(
      "/analyze",
      {
        repoUrl,
      }
    );

  return response.data;
}
