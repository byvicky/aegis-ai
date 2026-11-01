import { vulnerabilities } from "./mockData";
import { SeverityBadge } from "./SeverityBadge";

export function TopVulnerabilities() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold text-white">
            Top Vulnerabilities
          </h2>

          <p className="text-sm text-zinc-400">
            Most critical findings detected during the last scan.
          </p>

        </div>

        <button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-violet-400">
          View All
        </button>

      </div>

      <table className="w-full">

        <thead>

          <tr className="border-b border-zinc-800 text-left text-sm text-zinc-500">

            <th className="pb-4">Severity</th>

            <th className="pb-4">Rule</th>

            <th className="pb-4">File</th>

            <th className="pb-4">Status</th>

          </tr>

        </thead>

        <tbody>

          {vulnerabilities.map((item) => (

            <tr
              key={item.id}
              className="border-b border-zinc-800 hover:bg-zinc-800/40"
            >

              <td className="py-4">
                <SeverityBadge severity={item.severity} />
              </td>

              <td className="py-4 font-medium text-white">
                {item.rule}
              </td>

              <td className="py-4 text-zinc-400">
                {item.file}
              </td>

              <td className="py-4 text-zinc-300">
                {item.status}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </section>
  );
}