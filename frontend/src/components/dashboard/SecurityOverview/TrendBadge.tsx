import { ArrowUpRight } from "lucide-react";

interface TrendBadgeProps {
  value: string;
}

export function TrendBadge({
  value,
}: TrendBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-violet-600/20 px-3 py-1">

      <ArrowUpRight
        size={16}
        className="text-violet-400"
      />

      <span className="text-sm font-medium text-violet-300">
        {value}
      </span>

    </div>
  );
}