import { formatDateTime } from "@/lib/ui/format";
import {
  TRAVELER_LABELS,
  TRAVELER_STEPS,
  travelerStepForJobStatus,
  type TravelerStep,
  type TravelerStepRow,
} from "@/lib/traveler/types";

interface Props {
  steps: TravelerStepRow[];
  jobStatus: string;
  emptyHint?: string;
}

type StepState = "complete" | "current" | "pending";

function deriveState(
  step: TravelerStep,
  completed: Set<TravelerStep>,
  current: TravelerStep | null,
): StepState {
  if (completed.has(step)) return "complete";
  if (current === step) return "current";
  return "pending";
}

const STATE_RING: Record<StepState, string> = {
  complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  current: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  pending: "border-slate-700 bg-slate-900/40 text-slate-500",
};

const STATE_DOT: Record<StepState, string> = {
  complete: "bg-emerald-400",
  current: "bg-cyan-400 animate-pulse",
  pending: "bg-slate-700",
};

const STATE_LABEL: Record<StepState, string> = {
  complete: "Done",
  current: "In progress",
  pending: "Pending",
};

export function JobTraveler({ steps, jobStatus, emptyHint }: Props) {
  const completedMap = new Map<TravelerStep, TravelerStepRow>();
  for (const s of steps) completedMap.set(s.step, s);
  const completedSet = new Set(completedMap.keys());

  const current = travelerStepForJobStatus(jobStatus);
  const noProgress = completedSet.size === 0 && current === null;

  if (noProgress && emptyHint) {
    return (
      <p className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
        {emptyHint}
      </p>
    );
  }

  return (
    <ol className="grid gap-2 md:grid-cols-4">
      {TRAVELER_STEPS.map((step, i) => {
        const state = deriveState(step, completedSet, current);
        const completed = completedMap.get(step);
        return (
          <li
            key={step}
            className={`relative rounded-md border px-3 py-2.5 ${STATE_RING[state]}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${STATE_DOT[state]}`}
                aria-hidden
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
                Step {i + 1}
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold">
              {TRAVELER_LABELS[step]}
            </div>
            <div className="mt-0.5 text-[11px] opacity-80">
              {STATE_LABEL[state]}
              {completed
                ? ` · ${formatDateTime(completed.completed_at)}`
                : ""}
            </div>
            {completed?.note && (
              <p className="mt-1 line-clamp-2 text-[11px] opacity-70">
                {completed.note}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
