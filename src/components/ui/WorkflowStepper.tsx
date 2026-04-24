interface Step {
  label: string;
  key: string;
}

export function WorkflowStepper({
  steps,
  currentKey,
}: {
  steps: Step[];
  currentKey: string;
}) {
  const currentIdx = Math.max(
    0,
    steps.findIndex((s) => s.key === currentKey),
  );
  return (
    <ol className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
                active
                  ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/30"
                  : done
                    ? "text-emerald-300"
                    : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  active
                    ? "bg-cyan-400 text-slate-950"
                    : done
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`mx-1 h-px w-6 ${
                  done ? "bg-emerald-500/40" : "bg-slate-800"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
