import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Bug, CheckCircle2, Filter, Loader2, Search, Shield, Sparkles } from "lucide-react";

import { analyzeRepository, type AIAdvisorData, type AnalyzeResponse, type Finding } from "@/api/analyze";
import { ScannerStatusList } from "@/components/analysis/ScannerStatusList";
import { UnifiedFindingsTable } from "@/components/analysis/UnifiedFindingsTable";
import { CorrelationSummary } from "@/components/analysis/CorrelationSummary";
import { normalizeScannerResults, SUPPORTED_SCANNERS } from "@/components/analysis/scannerConfig";

interface NewAnalysisProps { onBack: () => void; }
type FilterValue = "all" | "semgrep" | "bandit" | "trivy" | "owasp zap" | "critical" | "high" | "medium" | "low";

const filters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" }, { value: "semgrep", label: "Semgrep" }, { value: "bandit", label: "Bandit" },
  { value: "trivy", label: "Trivy" }, { value: "owasp zap", label: "ZAP" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" },
  { value: "medium", label: "Medium" }, { value: "low", label: "Low" },
];

function severityClass(severity?: string) {
  switch (severity?.toUpperCase()) {
    case "CRITICAL": case "ERROR": return "border-red-500/30 bg-red-500/10 text-red-400";
    case "HIGH": return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    case "MEDIUM": case "WARNING": return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    case "LOW": return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    default: return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

function countSeverities(findings: Finding[]) {
  return findings.reduce((counts, finding) => {
    const severity = finding.severity?.toUpperCase();
    if (severity === "CRITICAL" || severity === "ERROR") counts.critical += 1;
    else if (severity === "HIGH") counts.high += 1;
    else if (severity === "MEDIUM" || severity === "WARNING") counts.medium += 1;
    else if (severity === "LOW") counts.low += 1;
    return counts;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
}

function resultFindings(result: AnalyzeResponse) {
  const scanners = normalizeScannerResults(result.scannerResults || result.scanners);
  const fromScanners = scanners.flatMap((scanner) => scanner.findings || []);
  return result.uniqueFindings || result.findings || (fromScanners.length > 0 ? fromScanners : []);
}

function errorText(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message;
  }
  return undefined;
}

export function NewAnalysis({ onBack }: NewAnalysisProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  const scanners = useMemo(() => result ? normalizeScannerResults(result.scannerResults || result.scanners) : [], [result]);
  const findings = useMemo(() => result ? resultFindings(result) : [], [result]);
  const filteredFindings = useMemo(() => findings.filter((finding) => {
    if (filter === "all") return true;
    if (["critical", "high", "medium", "low"].includes(filter)) return finding.severity?.toLowerCase() === filter || (filter === "critical" && finding.severity?.toLowerCase() === "error") || (filter === "medium" && finding.severity?.toLowerCase() === "warning");
    return (finding.scanner || finding.source || "").toLowerCase() === filter;
  }), [findings, filter]);
  const severities = useMemo(() => countSeverities(findings), [findings]);
  async function handleAnalysis() {
    if (!repoUrl.trim()) { setError("Please enter a repository URL."); return; }
    setLoading(true); setError(null); setResult(null); setFilter("all");
    try { setResult(await analyzeRepository(repoUrl.trim())); }
    catch (requestError) { setError(errorText(requestError) || "Unable to analyze the repository."); }
    finally { setLoading(false); }
  }

  const aiData = result?.aiAdvisor?.success ? result.aiAdvisor.data : undefined;
  const technicalFindings = findings.length;
  const rawCount = result?.rawFindingCount ?? result?.rawFindings?.length ?? technicalFindings;
  const uniqueCount = result?.uniqueFindingCount ?? result?.uniqueFindings?.length ?? result?.totalFindings ?? technicalFindings;

  return <div className="min-h-screen bg-zinc-950 text-white">
    <header className="border-b border-zinc-800"><div className="mx-auto max-w-7xl px-6 py-5">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"><ArrowLeft size={17} />Back</button>
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10"><Shield size={22} className="text-violet-400" /></div><div><h1 className="text-2xl font-semibold">New Analysis</h1><p className="mt-1 text-sm text-zinc-500">Multi-scanner application security analysis</p></div></div>
    </div></header>
    <main className="mx-auto max-w-7xl px-6 py-8">
      {!result && <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="mb-5 flex items-center gap-2"><Search size={19} className="text-violet-400" /><h2 className="text-lg font-semibold">Repository</h2></div>
        <p className="mb-5 text-sm text-zinc-500">Run the configured SAST, SCA and optional DAST scanners for a public Git repository.</p>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Repository URL</label>
        <input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} onKeyDown={(event) => event.key === "Enter" && !loading && handleAnalysis()} disabled={loading} placeholder="https://github.com/owner/repository" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 disabled:opacity-50" />
        {error && <div className="mt-4 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4"><AlertTriangle size={18} className="shrink-0 text-red-400" /><p className="text-sm text-red-300">{error}</p></div>}
        <button onClick={handleAnalysis} disabled={loading || !repoUrl.trim()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><Loader2 size={18} className="animate-spin" />Analyzing repository...</> : <><Search size={18} />Start Analysis</>}</button>
        {loading && <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4"><p className="text-sm font-medium text-zinc-200">Configured security pipeline</p><p className="mt-1 text-xs text-zinc-500">Running security analysis. Per-scanner completion is reported when the API response arrives.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{SUPPORTED_SCANNERS.map((scanner) => <div key={scanner.scanner} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs"><span className="text-zinc-300">{scanner.scanner} <span className="text-zinc-500">· {scanner.type}</span></span><span className="text-violet-300">Queued</span></div>)}</div></div>}
      </section>}

      {result && <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><CheckCircle2 size={21} className="text-emerald-400" /><h2 className="text-xl font-semibold">Technical analysis completed</h2></div><p className="mt-2 break-all text-sm text-zinc-500">{repoUrl}</p></div><button onClick={() => { setResult(null); setError(null); }} className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900">New Analysis</button></div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Metric label="Risk Score" value={result.riskScore ?? 0} /><Metric label="Risk Level" value={result.riskLevel ?? "UNKNOWN"} /><Metric label="Total Findings" value={result.totalFindings ?? uniqueCount} /><Metric label="Scan ID" value={result.scanId ?? "—"} /></section>
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4"><SeverityMetric label="Critical" value={severities.critical} color="red" /><SeverityMetric label="High" value={severities.high} color="orange" /><SeverityMetric label="Medium" value={severities.medium} color="yellow" /><SeverityMetric label="Low" value={severities.low} color="blue" /></section>

        <ScannerStatusList scanners={scanners} />

        <CorrelationSummary rawFindings={rawCount} uniqueFindings={uniqueCount} historicalCorrelation={result.historicalCorrelation} aiCorrelation={result.aiCorrelation} />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"><div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-semibold">Unified Security Findings</h2><p className="mt-1 text-sm text-zinc-500">SAST, SCA and DAST findings from available security sources.</p></div><div className="flex items-center gap-2 text-xs text-zinc-500"><Bug size={15} />{filteredFindings.length} shown</div></div><div className="mb-5 flex flex-wrap gap-2"><Filter size={16} className="mt-1 text-zinc-500" />{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${filter === item.value ? "border-violet-500/50 bg-violet-500/10 text-violet-300" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"}`}>{item.label}</button>)}</div><UnifiedFindingsTable findings={filteredFindings} /></section>

        <AdvisorPanel aiData={aiData} />
      </div>}
    </main>
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) { return <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"><p className="text-sm text-zinc-500">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p>{detail && <p className="mt-2 text-xs text-zinc-600">{detail}</p>}</article>; }
function SeverityMetric({ label, value, color }: { label: string; value: number; color: "red" | "orange" | "yellow" | "blue" }) { const colors = { red: "text-red-400", orange: "text-orange-400", yellow: "text-yellow-400", blue: "text-blue-400" }; return <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"><p className={`text-xs uppercase tracking-wider ${colors[color]}`}>{label}</p><p className={`mt-2 text-2xl font-semibold ${colors[color]}`}>{value}</p></article>; }

function AdvisorPanel({ aiData }: { aiData?: AIAdvisorData }) {
  if (!aiData) return <section className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><AlertTriangle className="shrink-0 text-amber-400" size={20} /><div><h2 className="font-medium text-amber-300">AI Security Advisor unavailable</h2><p className="mt-1 text-sm text-zinc-400">The technical analysis was completed, but the AI Security Advisor is temporarily unavailable.</p></div></section>;

  return <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
    <div className="mb-4 flex items-center gap-3"><Sparkles className="text-violet-400" size={21} /><div><h2 className="text-lg font-semibold">AI Security Advisor</h2><p className="text-sm text-zinc-500">{aiData.findingsAnalyzed ?? 0} findings analyzed · Priority: {aiData.priority || "UNKNOWN"}</p></div><span className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold ${severityClass(aiData.riskLevel)}`}>{aiData.riskLevel || "UNKNOWN"}</span></div>
    <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 leading-7 text-zinc-300">{aiData.summary || "No AI summary was returned."}</p>
    {(aiData.keyRisks || []).length > 0 && <div className="mt-4"><h3 className="mb-2 text-sm font-medium text-violet-300">Key Risks</h3><div className="space-y-2">{aiData.keyRisks.map((risk, index) => <div key={`${risk.title}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-sm font-medium text-zinc-200">{risk.title}</p><p className="mt-1 text-xs text-zinc-500">{risk.explanation}</p></div>)}</div></div>}
    {(aiData.recommendations || []).length > 0 && <div className="mt-4"><h3 className="mb-2 text-sm font-medium text-violet-300">Recommended Actions</h3><ul className="space-y-2 text-sm text-zinc-300">{aiData.recommendations.map((item, index) => <li key={`${item}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">{item}</li>)}</ul></div>}
  </section>;
}
