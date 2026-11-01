import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  Loader2,
  ShieldAlert,
  SkipForward,
} from "lucide-react";

import type { ScannerResult, ScannerStatus } from "@/api/analyze";

interface ScannerStatusListProps {
  scanners: ScannerResult[];
}

const statusConfig: Record<ScannerStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  skipped: { label: "Skipped", className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  failed: { label: "Failed", className: "border-red-500/30 bg-red-500/10 text-red-400" },
  unavailable: { label: "Unavailable", className: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  pending: { label: "Pending", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  running: { label: "Running", className: "border-violet-500/30 bg-violet-500/10 text-violet-400" },
};

function StatusIcon({ status }: { status: ScannerStatus }) {
  if (status === "completed") return <CheckCircle2 size={18} className="text-emerald-400" />;
  if (status === "skipped") return <SkipForward size={18} className="text-zinc-400" />;
  if (status === "failed") return <ShieldAlert size={18} className="text-red-400" />;
  if (status === "unavailable") return <ShieldAlert size={18} className="text-amber-300" />;
  if (status === "running") return <Loader2 size={18} className="animate-spin text-violet-400" />;
  return <CircleDashed size={18} className="text-amber-400" />;
}

function formatDuration(durationMs?: number) {
  if (typeof durationMs !== "number") return "—";
  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(1)} s`;
}

function errorMessage(error: ScannerResult["error"]) {
  return typeof error === "string" ? error : error?.message;
}

export function ScannerStatusList({ scanners }: ScannerStatusListProps) {
  if (scanners.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Scanner Status</h2>
        <p className="mt-1 text-sm text-zinc-500">Execution status for every configured security scanner.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {scanners.map((scanner, index) => {
          const status = statusConfig[scanner.status] ? scanner.status : "pending";
          const config = statusConfig[status];
          const message = errorMessage(scanner.error);

          return (
            <article key={`${scanner.scanner}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2"><StatusIcon status={status} /></div>
                  <div>
                    <h3 className="font-medium text-white">{scanner.scanner || "Scanner"}</h3>
                    <p className="text-xs text-zinc-500">{scanner.type || "Security scan"}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${config.className}`}>{config.label}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span>{scanner.findingCount ?? scanner.findings?.length ?? 0} findings</span>
                <span className="flex items-center gap-1"><Clock3 size={13} />{formatDuration(scanner.durationMs)}</span>
              </div>
              {message && <p className={`mt-3 rounded-lg border p-2 text-xs ${status === "failed" ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-amber-500/20 bg-amber-500/5 text-amber-200"}`}>{message}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
