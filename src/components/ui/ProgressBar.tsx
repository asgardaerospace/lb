export function ProgressBar({
  value,
  tone = "accent",
  showLabel = true,
}: {
  value: number;
  tone?: "accent" | "emerald" | "amber";
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor =
    tone === "emerald"
      ? "bg-emerald-400"
      : tone === "amber"
        ? "bg-amber-400"
        : "bg-cyan-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-10 text-right text-[11px] tabular-nums text-slate-400">
          {clamped}%
        </span>
      )}
    </div>
  );
}
