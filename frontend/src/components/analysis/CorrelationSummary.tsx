import type {
  AICorrelationMatch,
  AICorrelationResponse,
  HistoricalCorrelationEntry,
  HistoricalCorrelationResponse,
} from "@/api/analyze";

interface CorrelationSummaryProps {
  rawFindings: number;
  uniqueFindings: number;
  historicalCorrelation?: HistoricalCorrelationResponse | HistoricalCorrelationEntry[];
  aiCorrelation?: AICorrelationResponse | AICorrelationMatch[];
}

function historicalSummary(value: CorrelationSummaryProps["historicalCorrelation"]) {
  if (Array.isArray(value)) {
    const matches = value.flatMap((entry) => entry.historicalMatches || []);
    return { status: matches.length ? "completed" : "no_matches", matches };
  }
  return { status: value?.status || "no_matches", matches: value?.matches || [] };
}

function aiSummary(value: CorrelationSummaryProps["aiCorrelation"]) {
  if (Array.isArray(value)) {
    const unavailable = value.some((entry) => entry.status === "unavailable");
    const completed = value.some((entry) => entry.status === "completed");
    return { status: completed ? "completed" : unavailable ? "unavailable" : "skipped", matches: value };
  }
  return { status: value?.status || "skipped", matches: value?.matches || [] };
}

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function CorrelationSummary(props: CorrelationSummaryProps) {
  const historical = historicalSummary(props.historicalCorrelation);
  const ai = aiSummary(props.aiCorrelation);
  const completedAi = ai.matches.find((match) => match.status === "completed");

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="mb-5"><h2 className="text-lg font-semibold">Correlation Summary</h2><p className="mt-1 text-sm text-zinc-500">Deterministic correlation remains the authoritative result.</p></div>
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Raw Findings" value={props.rawFindings} />
        <Stat label="Unique Findings" value={props.uniqueFindings} />
        <Stat label="Historical Matches" value={historical.matches.length} />
        <Stat label="AI Correlation" value={ai.status} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="font-medium text-zinc-200">Historical Correlation</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {historical.status === "unavailable" ? "Historical correlation is temporarily unavailable." : historical.matches.length ? `Previous matches: ${historical.matches.length}` : "No historical matches found."}
          </p>
          {historical.matches.length > 0 && <div className="mt-4 space-y-2">
            {historical.matches.slice(0, 5).map((match, index) => <div key={`${match.findingId || match.fingerprint || "match"}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
              <p className="font-medium text-zinc-200">{match.scanner || "Historical finding"} · {match.severity || "INFO"} · {match.rule || match.cve || "—"}</p>
              <p className="mt-1">First seen: {date(match.firstSeen)} · Last seen: {date(match.lastSeen)} · Occurrences: {match.occurrenceCount ?? 1}</p>
              {match.triageStatus && <p className="mt-1 text-violet-300">Triage: {match.triageStatus}</p>}
            </div>)}
          </div>}
        </article>

        <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="font-medium text-zinc-200">AI Correlation</h3>
          {ai.status === "completed" && completedAi ? <div className="mt-2 text-sm text-zinc-400"><p>Suggestion confidence: {Math.round((completedAi.confidence || 0) * 100)}%</p><p className="mt-1">{completedAi.reason || "Correlation suggestion available."}</p>{(completedAi.relatedFindings || []).length > 0 && <p className="mt-1 text-xs text-zinc-500">Related findings: {completedAi.relatedFindings?.join(", ")}</p>}{(completedAi.signals || []).length > 0 && <p className="mt-1 text-xs text-zinc-500">Signals: {completedAi.signals?.join(", ")}</p>}<p className="mt-2 text-xs text-zinc-500">This is advisory only; it does not change risk, severity, or triage.</p></div> : <p className="mt-2 text-sm text-zinc-500">{ai.status === "unavailable" ? "AI correlation unavailable. Deterministic correlation was used." : "AI correlation was not required for this analysis."}</p>}
        </article>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-2 text-xl font-semibold text-zinc-100">{value}</p></div>;
}
