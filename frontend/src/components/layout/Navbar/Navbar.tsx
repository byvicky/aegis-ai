import { Bell, Moon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Navbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Dashboard
        </h1>

        <p className="text-sm text-zinc-400">
          Monitor your repositories and security posture
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <Input
            placeholder="Search..."
            className="w-72 border-zinc-700 bg-zinc-900 pl-10"
          />
        </div>

        <button className="rounded-xl border border-zinc-700 p-3 hover:bg-zinc-800 transition">
          <Moon size={18} />
        </button>

        <button className="rounded-xl border border-zinc-700 p-3 hover:bg-zinc-800 transition">
          <Bell size={18} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
          L
        </div>

      </div>
    </header>
  );
}