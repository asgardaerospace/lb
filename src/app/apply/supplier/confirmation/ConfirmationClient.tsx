"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/shell/Logo";
import { LinkButton } from "@/components/ui";
import {
  clearSubmission,
  loadSubmission,
  type StoredSupplierSubmission,
} from "../draftStorage";

export function ConfirmationClient() {
  const [submission, setSubmission] = useState<StoredSupplierSubmission | null>(
    null,
  );

  useEffect(() => {
    const sub = loadSubmission();
    if (sub) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmission(sub);
    }
  }, []);

  function startAnother() {
    clearSubmission();
    window.location.href = "/apply/supplier";
  }

  const isPreview = submission?.previewMode ?? !submission;
  const applicationId = submission?.applicationId ?? null;
  const submittedAt = submission?.submittedAt
    ? new Date(submission.submittedAt)
    : null;
  const legalName = submission?.legalName ?? "—";
  const counts = submission
    ? {
        capabilities: submission.payload.capabilities.length,
        machines: submission.payload.machines.length,
        certifications: submission.payload.certifications.length,
        past_performance: submission.payload.past_performance.length,
        primary_processes: submission.payload.primary_processes.length,
      }
    : null;

  return (
    <main
      className="flex min-h-screen flex-col items-center px-5 py-12 text-slate-200 sm:px-8"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(34,211,238,0.05), transparent 55%), #03060c",
      }}
    >
      <div className="mb-10 self-start sm:mb-14">
        <Logo />
      </div>

      <div className="w-full max-w-[760px]">
        <StatusBadge previewMode={isPreview} />
        <h1 className="m-0 text-[28px] font-medium tracking-tight text-slate-100 sm:text-[32px]">
          {isPreview
            ? "Application captured (preview mode)."
            : "Application received."}
        </h1>
        <p className="mt-3 max-w-[640px] text-[14px] leading-relaxed text-slate-400">
          {isPreview
            ? "Supabase isn't wired in this environment, so nothing was written to the database. Your draft is still in this browser for reference."
            : "Asgard's supplier-onboarding team will review your application and reach out within five business days. Approved suppliers enter the routing candidate pool for active customer programs."}
        </p>

        {/* Submission identifier */}
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3 font-mono text-[11.5px] text-slate-400">
          <span className="uppercase tracking-[0.08em] text-slate-500">
            Application ID
          </span>
          <span className="ml-2 text-slate-200">
            {applicationId ?? "— (preview mode)"}
          </span>
          {submittedAt && (
            <>
              <span className="ml-3 uppercase tracking-[0.08em] text-slate-500">
                Submitted
              </span>
              <span className="ml-2 text-slate-200">
                {submittedAt.toLocaleString()}
              </span>
            </>
          )}
        </div>

        {/* Snapshot summary */}
        <div className="mt-6 grid gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-5 sm:grid-cols-2">
          <Field label="Company">{legalName}</Field>
          {counts && (
            <>
              <Field label="Primary processes">
                <span className="tabular-nums">{counts.primary_processes}</span>
              </Field>
              <Field label="Capabilities">
                <span className="tabular-nums">{counts.capabilities}</span>
              </Field>
              <Field label="Machines">
                <span className="tabular-nums">{counts.machines}</span>
              </Field>
              <Field label="Certifications">
                <span className="tabular-nums">{counts.certifications}</span>
              </Field>
              <Field label="Past performance">
                <span className="tabular-nums">{counts.past_performance}</span>
              </Field>
            </>
          )}
        </div>

        {/* What happens next */}
        <h2 className="mt-10 mb-3 text-[15px] font-medium text-slate-100">
          What happens next
        </h2>
        <ol className="space-y-3">
          {[
            [
              "1",
              "Asgard review",
              "Your intake is read against AS9100 / NADCAP / ITAR / CMMC requirements and matched to active customer programs that need your capability set.",
            ],
            [
              "2",
              "Capability verification",
              "We may ask for follow-up evidence — certificate copies, machine manuals, sample part QA reports — before approval.",
            ],
            [
              "3",
              "Routing pool admission",
              "Approved suppliers enter the routing candidate pool. RFQs that match your process × material × compliance fingerprint will start arriving.",
            ],
            [
              "4",
              "Supplier portal access",
              "We'll provision a supplier_admin account so you can view incoming RFQs, submit quotes, and run jobs through Launchbelt.",
            ],
          ].map(([n, title, body]) => (
            <li
              key={n}
              className="grid items-start gap-3 rounded-md border border-slate-800 bg-slate-900/40 p-3.5"
              style={{ gridTemplateColumns: "32px 1fr" }}
            >
              <span className="grid h-7 w-7 place-content-center rounded-md border border-slate-800 bg-slate-900 font-mono text-[11.5px] font-semibold text-cyan-300">
                {n}
              </span>
              <span>
                <span className="block text-[13.5px] font-medium text-slate-100">
                  {title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500">
                  {body}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <LinkButton href="/" variant="primary">
            Return to Launchbelt
          </LinkButton>
          <button
            type="button"
            onClick={startAnother}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/60 hover:text-slate-100"
          >
            Start another application →
          </button>
        </div>

        {isPreview && (
          <p className="mt-10 text-[11.5px] text-slate-600">
            Preview intake: responses are not saved to a server. Set the
            Supabase environment variables to enable real persistence.
          </p>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ previewMode }: { previewMode: boolean }) {
  if (previewMode) {
    return (
      <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-300">
        <span
          className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]"
          aria-hidden
        />
        Preview · not persisted
      </div>
    );
  }
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
      <span
        className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]"
        aria-hidden
      />
      Submitted
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-[13.5px] text-slate-100">{children}</div>
    </div>
  );
}
