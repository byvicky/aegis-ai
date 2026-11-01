import type { LucideIcon } from "lucide-react";

interface StatusItemProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}

export function StatusItem({
  icon: Icon,
  label,
  value,
  color = "text-white",
}: StatusItemProps) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <Icon
          size={18}
          className="text-violet-400"
        />

        <span className="text-sm text-zinc-400">
          {label}
        </span>

      </div>

      <span className={`font-semibold ${color}`}>
        {value}
      </span>

    </div>
  );
}