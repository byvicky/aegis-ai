import { Circle } from "lucide-react";

export function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-zinc-800 pt-5">
      <div className="flex items-center gap-2">
        <Circle
          size={10}
          className="fill-green-500 text-green-500"
        />

        <span className="text-sm text-zinc-300">
          Backend Connected
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Version 1.0.0
      </p>
    </div>
  );
}