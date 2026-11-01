interface RecommendationItemProps {
  index: number;
  title: string;
}

export function RecommendationItem({
  index,
  title,
}: RecommendationItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3">

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
        {index}
      </div>

      <span className="text-zinc-300">
        {title}
      </span>

    </div>
  );
}