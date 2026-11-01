import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar/Sidebar";
import { Navbar } from "./Navbar/Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        <Navbar />

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>

      </div>
    </div>
  );
}