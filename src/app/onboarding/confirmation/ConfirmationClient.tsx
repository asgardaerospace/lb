"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/shell/Logo";
import { LinkButton } from "@/components/ui";
import { DRAFT_KEY, type StoredDraft } from "../draftStorage";
import { deriveTier, initialCustomer, type CustomerData } from "../types";

export function ConfirmationClient() {
  const [snapshot, setSnapshot] = useState<CustomerData | null>(null);

  // Hydrate snapshot from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDraft;
        if (parsed?.data) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSnapshot(parsed.data);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function startAnother() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY);
    }
    window.location.href = "/onboarding";
  }

  const d = snapshot ?? initialCustomer();
  const tier = deriveTier(d);
  const w = d.workspace;

  return (
    <div
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]"
            aria-hidden
          />
          Submitted
        </div>
        <h1 className="m-0 text-[28px] font-medium tracking-tight text-slate-100 sm:text-[32px]">
          Your workspace is being provisioned.
        </h1>
        <p className="mt-3 max-w-[640px] text-[14px] leading-relaxed text-slate-400">
          We&apos;ve captured your configuration. A Launchbelt forward-deployed
          engineer will reach out within one business day to confirm
          provisioning details and schedule kickoff.
        </p>

        <div className="mt-8 grid gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-5 sm:grid-cols-2">
          <Field label="Company">{d.company.legal_name}</Field>
          <Field label="Tier">
            <span className="font-mono text-[12px] tracking-wider text-cyan-300">
              {tier}
            </span>
          </Field>
          <Field label="Workspace">
            {w.workspace_name} ·{" "}
            <span className="font-mono text-[12px] text-slate-400">
              {w.subdomain}.launchbelt.com
            </span>
          </Field>
          <Field label="Data residency">
            <span className="font-mono text-[12px] text-slate-400">
              {w.data_residency.replace("_", "-").toUpperCase()}
            </span>
          </Field>
          <Field label="SSO">{w.sso_provider}</Field>
          <Field label="Initial seats">
            <span className="font-mono tabular-nums">{w.seats}</span>
          </Field>
        </div>

        <ol className="mt-8 space-y-3">
          {[
            ["1", "Workspace provisioned", `In ${w.data_residency.replace("_", "-").toUpperCase()} — typical SLA ≈ 90 seconds.`],
            ["2", "SSO registration", `${w.sso_provider} federation handshake for ${w.seats} seats.`],
            ["3", "RFQ templates seeded", "Compliance flow-down (FAR/DFARS, ITAR, CMMC) pre-applied."],
            ["4", "Supplier shortlist", "Generated and ranked by your routing weights."],
            ["5", "FDE kickoff", "Calendar invite sent to your primary contact."],
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

        <p className="mt-10 text-[11.5px] text-slate-600">
          Preview environment — this submission is not yet wired to the backend.
          A draft snapshot was kept in your browser for reference.
        </p>
      </div>
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
