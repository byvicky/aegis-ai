import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  title: string;
  icon: LucideIcon;
  active?: boolean;
}

export function SidebarItem({
  title,
  icon: Icon,
  active = false,
}: SidebarItemProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
        active
          ? "bg-violet-600 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      )}
    >
      <Icon size={20} />
      <span className="font-medium">{title}</span>
    </button>
  );
}