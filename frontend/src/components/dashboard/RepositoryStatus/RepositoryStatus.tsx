import {
  Bot,
  Clock3,
  FolderGit2,
  ScanSearch,
  Timer,
} from "lucide-react";

import { ProgressBar } from "./ProgressBar";
import { repositoryStatus } from "./mockData";
import { StatusItem } from "./StatusItem";

export function RepositoryStatus() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="mb-6">

        <h2 className="text-xl font-semibold text-white">
          Repository Status
        </h2>

        <p className="text-sm text-zinc-400">
          Current platform operational status
        </p>

      </div>

      <div className="space-y-5">

        <StatusItem
          icon={ScanSearch}
          label="Scanner"
          value={repositoryStatus.scanner}
          color="text-green-400"
        />

        <StatusItem
          icon={Bot}
          label="AI Advisor"
          value={repositoryStatus.ai}
          color="text-green-400"
        />

        <StatusItem
          icon={FolderGit2}
          label="Repositories"
          value={repositoryStatus.repositories}
        />

        <StatusItem
          icon={Clock3}
          label="Last Scan"
          value={repositoryStatus.lastScan}
        />

        <StatusItem
          icon={Timer}
          label="Avg Scan Time"
          value={repositoryStatus.averageScan}
        />

      </div>

      <ProgressBar
        value={repositoryStatus.health}
      />

    </section>
  );
}