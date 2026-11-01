import type { Finding } from "@/api/analyze";

interface UnifiedFindingsTableProps {
  findings: Finding[];
}

function severityClass(severity?: string) {
  switch (severity?.toUpperCase()) {
    case "CRITICAL": case "ERROR": return "border-red-500/30 bg-red-500/10 text-red-400";
    case "HIGH": return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    case "MEDIUM": case "WARNING": return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    case "LOW": return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    default: return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

function versionFromEvidence(evidence?: string, label?: string) {
  if (!evidence || !label) return undefined;
  return evidence.match(new RegExp(`${label}:\\s*([^;]+)`, "i"))?.[1]?.trim();
}

export function UnifiedFindingsTable({ findings }: UnifiedFindingsTableProps) {
  if (findings.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No findings match the selected filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-3 py-3 font-medium">Scanner / Type</th><th className="px-3 py-3 font-medium">Severity</th>
            <th className="px-3 py-3 font-medium">Rule / CVE</th><th className="px-3 py-3 font-medium">Finding</th>
            <th className="px-3 py-3 font-medium">Location</th><th className="px-3 py-3 font-medium">Package / Version</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding, index) => {
            const installed = finding.installedVersion || versionFromEvidence(finding.evidence, "Installed");
            const fixed = finding.fixedVersion || versionFromEvidence(finding.evidence, "Fixed");
            const ruleOrCve = finding.cve || finding.ruleId || finding.title || "—";
            const title = finding.description || finding.message || finding.title || "Security finding";

            return <tr key={finding.id || finding.fingerprint || `${finding.title}-${index}`} className="border-b border-zinc-800/60 align-top last:border-0 hover:bg-zinc-900/60">
              <td className="px-3 py-4"><p className="font-medium text-zinc-200">{finding.scanner || finding.source || "Legacy"}</p><p className="mt-1 text-xs text-zinc-500">{finding.type || "SAST"}</p></td>
              <td className="px-3 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${severityClass(finding.severity)}`}>{finding.severity || "INFO"}</span></td>
              <td className="max-w-[190px] break-words px-3 py-4 font-mono text-xs text-violet-300">{ruleOrCve}</td>
              <td className="max-w-[320px] px-3 py-4"><p className="font-medium text-zinc-200">{finding.title || "Security finding"}</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-500">{title}</p>{finding.evidence && <p className="mt-2 line-clamp-2 font-mono text-[11px] text-zinc-600">{finding.evidence}</p>}</td>
              <td className="max-w-[220px] break-all px-3 py-4 text-xs text-zinc-400"><p>{finding.endpoint || finding.file || "—"}{finding.line ? `:${finding.line}` : ""}</p>{finding.method && <p className="mt-1 text-zinc-500">{finding.method}</p>}</td>
              <td className="max-w-[220px] px-3 py-4 text-xs text-zinc-400"><p>{finding.package || "—"}</p>{installed && <p className="mt-1">Installed: {installed}</p>}{fixed && <p className="text-emerald-400">Fixed: {fixed}</p>}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
