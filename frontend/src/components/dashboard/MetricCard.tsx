import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;

  trend?: number;

  color?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 0,
  color = "text-violet-500",
}: MetricCardProps) {
  const positive = trend >= 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-300 hover:border-violet-700 hover:shadow-lg hover:shadow-violet-950/30">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-zinc-800 p-3">
            <Icon className={color} size={22} />
          </div>

          <h3 className="text-sm font-medium text-zinc-400">
            {title}
          </h3>

        </div>

        <div
          className={`flex items-center gap-1 text-sm ${
            positive ? "text-green-400" : "text-red-400"
          }`}
        >
          {positive ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}

          {Math.abs(trend)}%
        </div>

      </div>

      <div className="mt-6">

        <p className={`text-5xl font-bold ${color}`}>
          {value}
        </p>

        <p className="mt-2 text-sm text-zinc-500">
          {subtitle}
        </p>

      </div>

    </div>
  );
}