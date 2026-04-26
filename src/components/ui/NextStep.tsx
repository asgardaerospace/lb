import Link from "next/link";

type NextStepTone = "info" | "success" | "warn" | "neutral";

const TONE: Record<NextStepTone, string> = {
  info: "border-cyan-500/25 bg-cyan-500/5",
  success: "border-emerald-500/25 bg-emerald-500/5",
  warn: "border-amber-500/25 bg-amber-500/5",
  neutral: "border-slate-700 bg-slate-900/40",
};

const EYEBROW: Record<NextStepTone, string> = {
  info: "text-cyan-300",
  success: "text-emerald-300",
  warn: "text-amber-300",
  neutral: "text-slate-400",
};

interface NextStepProps {
  title: string;
  body?: string;
  tone?: NextStepTone;
  /** Optional primary CTA — usually the most natural next page. */
  cta?: { href: string; label: string };
  /** Optional secondary action (link or any node). */
  secondary?: React.ReactNode;
  className?: string;
}

/**
 * "What happens next" callout placed on detail screens so a user is never
 * left wondering whether the workflow ball is in their court. The eyebrow
 * + tone signals whose move it is at a glance.
 */
export function NextStep({
  title,
  body,
  tone = "info",
  cta,
  secondary,
  className = "",
}: NextStepProps) {
  return (
    <div
      className={`mb-5 flex flex-wrap items-start justify-between gap-3 rounded-md border px-4 py-3 ${TONE[tone]} ${className}`}
    >
      <div className="min-w-0">
        <div
          className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${EYEBROW[tone]}`}
        >
          Next step
        </div>
        <div className="mt-1 text-sm font-medium text-slate-100">{title}</div>
        {body && <p className="mt-1 text-xs text-slate-400">{body}</p>}
      </div>
      <div className="flex items-center gap-2">
        {secondary}
        {cta && (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {cta.label}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
