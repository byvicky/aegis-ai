import { Shield } from "lucide-react";

export function SidebarHeader() {
  return (
    <div className="border-b border-zinc-800 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
          <Shield size={24} className="text-white" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-white">
            AEGIS AI
          </h1>

          <p className="text-sm text-zinc-400">
            Security Platform
          </p>
        </div>
      </div>
    </div>
  );
}