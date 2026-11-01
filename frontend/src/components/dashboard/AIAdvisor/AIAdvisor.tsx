import { Bot, Sparkles } from "lucide-react";

import { advisor } from "./mockData";
import { ProgressBar } from "./ProgressBar";
import { RecommendationItem } from "./RecommendationItem";

export function AIAdvisor() {
  return (
    <section className="rounded-2xl border border-violet-900/40 bg-zinc-900 p-6">

      <div className="mb-6 flex items-center gap-3">

        <div className="rounded-xl bg-violet-600/20 p-3">

          <Bot
            size={24}
            className="text-violet-400"
          />

        </div>

        <div>

          <h2 className="text-xl font-semibold text-white">
            AI Security Advisor
          </h2>

          <p className="text-sm text-zinc-400">
            Intelligent remediation guidance
          </p>

        </div>

      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">

        <div className="mb-3 flex items-center gap-2">

          <Sparkles
            size={18}
            className="text-violet-400"
          />

          <span className="font-semibold text-white">
            Overall Assessment
          </span>

        </div>

        <p className="leading-7 text-zinc-300">
          {advisor.assessment}
        </p>

      </div>

      <div className="mt-6">

        <h3 className="mb-4 font-semibold text-white">
          Recommended Actions
        </h3>

        <div className="space-y-3">

          {advisor.recommendations.map((item, index) => (

            <RecommendationItem
              key={item}
              index={index + 1}
              title={item}
            />

          ))}

        </div>

      </div>

      <div className="mt-8">

        <p className="text-sm text-zinc-400">
          Estimated Remediation Time
        </p>

        <p className="mt-2 text-2xl font-bold text-white">
          {advisor.remediationTime}
        </p>

      </div>

      <ProgressBar
        value={advisor.riskReduction}
      />

      <button className="mt-8 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700">
        Generate Full Report
      </button>

    </section>
  );
}