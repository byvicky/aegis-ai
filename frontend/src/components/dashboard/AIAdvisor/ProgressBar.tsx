interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="mt-4">

      <div className="mb-2 flex justify-between">

        <span className="text-sm text-zinc-400">
          Risk Reduction
        </span>

        <span className="text-white font-semibold">
          {value}%
        </span>

      </div>

      <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">

        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-500"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}