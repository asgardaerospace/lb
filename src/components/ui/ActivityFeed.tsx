import { formatDateTime } from "@/lib/ui/format";
import {
  renderActivityEvent,
  type ActivityEvent,
} from "@/lib/activity/types";

interface Props {
  events: ActivityEvent[];
  emptyHint?: string;
  limit?: number;
}

const TONE_DOT: Record<string, string> = {
  neutral: "bg-slate-500",
  info: "bg-cyan-400",
  good: "bg-emerald-400",
  warn: "bg-amber-400",
  bad: "bg-rose-400",
};

const TONE_TEXT: Record<string, string> = {
  neutral: "text-slate-200",
  info: "text-cyan-200",
  good: "text-emerald-200",
  warn: "text-amber-200",
  bad: "text-rose-200",
};

export function ActivityFeed({
  events,
  emptyHint = "No activity recorded yet.",
  limit,
}: Props) {
  const sliced = typeof limit === "number" ? events.slice(0, limit) : events;
  const rows = sliced.map(renderActivityEvent);

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
        {emptyHint}
      </p>
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-slate-800 pl-4">
      {rows.map((r) => (
        <li key={r.id} className="relative">
          <span
            className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${TONE_DOT[r.tone] ?? TONE_DOT.neutral}`}
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={`text-sm font-medium ${TONE_TEXT[r.tone] ?? TONE_TEXT.neutral}`}
            >
              {r.title}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {formatDateTime(r.timestamp)}
            </span>
          </div>
          {r.detail && (
            <p className="mt-0.5 text-xs text-slate-400">{r.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
