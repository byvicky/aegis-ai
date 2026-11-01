interface SeverityBadgeProps {
  severity: string;
}

const colors = {
  Critical: "bg-red-500/20 text-red-400",
  High: "bg-orange-500/20 text-orange-400",
  Medium: "bg-yellow-500/20 text-yellow-300",
  Low: "bg-sky-500/20 text-sky-400",
};

export function SeverityBadge({
  severity,
}: SeverityBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        colors[severity as keyof typeof colors]
      }`}
    >
      {severity}
    </span>
  );
}