import { useState } from "react";

import { Dashboard } from "./pages/Dashboard/Dashboard";
import { NewAnalysis } from "./pages/NewAnalysis/NewAnalysis";

type Page = "dashboard" | "new-analysis";

function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {currentPage === "dashboard" && (
        <Dashboard
          onNewAnalysis={() => setCurrentPage("new-analysis")}
        />
      )}

      {currentPage === "new-analysis" && (
        <NewAnalysis
          onBack={() => setCurrentPage("dashboard")}
        />
      )}
    </div>
  );
}

export default App;