import { LastScan } from "./LastScan";
import { RiskChart } from "./RiskChart";
import { TrendBadge } from "./TrendBadge";

export function SecurityOverview() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="mb-8 flex items-start justify-between">

        <div>

          <h2 className="text-xl font-semibold text-white">
            Security Overview
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Overall application risk evolution
          </p>

        </div>

        <div className="flex items-center gap-6">

          <TrendBadge value="+8%" />

          <LastScan />

        </div>

      </div>

      <RiskChart />

    </section>
  );
}