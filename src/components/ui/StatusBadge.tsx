export type StatusTone = "neutral" | "info" | "success" | "warn" | "danger" | "accent";

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-slate-500/10 text-slate-300 ring-slate-500/20",
  info: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  success: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  danger: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
  accent: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/25",
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ring-1 ring-inset ${toneStyles[tone]}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

type StatusMap = Record<string, { label: string; tone: StatusTone }>;

export const rfqStatusMap: StatusMap = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  routing_in_progress: { label: "Routing", tone: "accent" },
  quotes_requested: { label: "Quotes Requested", tone: "warn" },
  awarded: { label: "Awarded", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const quoteStatusMap: StatusMap = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under Review", tone: "accent" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  declined: { label: "Declined", tone: "danger" },
};

export const jobStatusMap: StatusMap = {
  awarded: { label: "Awarded", tone: "info" },
  scheduled: { label: "Scheduled", tone: "info" },
  in_production: { label: "In Production", tone: "accent" },
  inspection: { label: "Inspection", tone: "warn" },
  shipped: { label: "Shipped", tone: "success" },
  complete: { label: "Complete", tone: "success" },
  hold: { label: "On Hold", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const supplierStatusMap: StatusMap = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under Review", tone: "accent" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  revisions_requested: { label: "Revisions Requested", tone: "warn" },
};

export const routingStatusMap: StatusMap = {
  pending: { label: "Pending", tone: "neutral" },
  quote_requested: { label: "Quote Requested", tone: "accent" },
};

export function mapStatus(
  map: StatusMap,
  key: string | null | undefined,
): { label: string; tone: StatusTone } {
  if (!key) return { label: "—", tone: "neutral" };
  return map[key] ?? { label: key, tone: "neutral" };
}
