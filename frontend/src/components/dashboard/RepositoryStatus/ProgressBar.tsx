interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="mt-3">

      <div className="mb-2 flex justify-between">

        <span className="text-sm text-zinc-400">
          Repository Health
        </span>

        <span className="font-semibold text-white">
          {value}%
        </span>

      </div>

      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

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