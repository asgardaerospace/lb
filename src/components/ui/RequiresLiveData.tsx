import Link from "next/link";

export function RequiresLiveData({
  title = "Live data required",
  reason,
  backHref,
  backLabel,
}: {
  title?: string;
  reason: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-6">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
        Preview mode
      </div>
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{reason}</p>
      <Link
        href={backHref}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-slate-950 transition hover:bg-cyan-400"
      >
        ← {backLabel}
      </Link>
    </div>
  );
}
