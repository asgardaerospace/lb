interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "cyan" | "amber" | "emerald" | "rose" | "slate";
}

const accentBar: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  cyan: "from-cyan-400/60 to-cyan-400/0",
  amber: "from-amber-400/60 to-amber-400/0",
  emerald: "from-emerald-400/60 to-emerald-400/0",
  rose: "from-rose-400/60 to-rose-400/0",
  slate: "from-slate-500/40 to-slate-500/0",
};

export function KpiCard({ label, value, sublabel, accent = "cyan" }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3.5">
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accentBar[accent]}`}
        aria-hidden
      />
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-50">
        {value}
      </div>
      {sublabel && (
        <div className="mt-0.5 text-[11px] text-slate-500">{sublabel}</div>
      )}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
  );
}
