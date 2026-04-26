"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Part } from "@/lib/rfq/types";
import type { RoutingDecision } from "@/lib/routing/types";
import type { RankedCandidate } from "@/lib/routing/scoring";
import { Button, StatusBadge } from "@/components/ui";

interface Props {
  workPackageId: string;
  attachedParts: Part[];
  unattachedParts: Part[];
  rankedCandidates: RankedCandidate[];
  initialDecisions: RoutingDecision[];
}

interface FormState {
  capability_fit_score: string;
  capacity_fit_score: string;
  compliance_fit_score: string;
  schedule_fit_score: string;
  routing_rationale: string;
}

const EMPTY_FORM: FormState = {
  capability_fit_score: "",
  capacity_fit_score: "",
  compliance_fit_score: "",
  schedule_fit_score: "",
  routing_rationale: "",
};

function scoreTone(score: number): "success" | "info" | "warn" | "danger" {
  if (score >= 75) return "success";
  if (score >= 55) return "info";
  if (score >= 35) return "warn";
  return "danger";
}

export default function WorkPackageDetail({
  workPackageId,
  attachedParts,
  unattachedParts,
  rankedCandidates,
  initialDecisions,
}: Props) {
  const router = useRouter();
  const [decisions, setDecisions] = useState<RoutingDecision[]>(initialDecisions);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const alreadyRoutedSupplierIds = useMemo(
    () => new Set(decisions.map((d) => d.supplier_organization_id)),
    [decisions],
  );

  const candidateName = (orgId: string) =>
    rankedCandidates.find((c) => c.organization_id === orgId)?.organization_name ??
    orgId;

  function applyCandidateAsAutofill(c: RankedCandidate) {
    setSelectedSupplier(c.organization_id);
    setForm({
      capability_fit_score: String(c.capability_fit_score),
      capacity_fit_score: String(c.capacity_fit_score),
      compliance_fit_score: String(c.compliance_fit_score),
      schedule_fit_score: String(c.capacity_fit_score),
      routing_rationale: [
        c.match_reasons.length > 0 ? `Strengths: ${c.match_reasons.join("; ")}` : null,
        c.gap_reasons.length > 0 ? `Gaps: ${c.gap_reasons.join("; ")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    if (typeof window !== "undefined") {
      const el = document.getElementById("routing-decision-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function attachPart(partId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/work-packages/${workPackageId}/parts`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ part_id: partId }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Attach failed");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Attach failed");
    } finally {
      setBusy(false);
    }
  }

  async function detachPart(partId: string) {
    if (!confirm("Remove this part from the package?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/work-packages/${workPackageId}/parts/${partId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Detach failed");
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Detach failed");
    } finally {
      setBusy(false);
    }
  }

  function scoreOrNull(v: string): number | null {
    return v.trim() === "" ? null : Number.parseInt(v, 10);
  }

  async function createRoutingDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplier) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/work-packages/${workPackageId}/routing-decisions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            supplier_organization_id: selectedSupplier,
            capability_fit_score: scoreOrNull(form.capability_fit_score),
            capacity_fit_score: scoreOrNull(form.capacity_fit_score),
            compliance_fit_score: scoreOrNull(form.compliance_fit_score),
            schedule_fit_score: scoreOrNull(form.schedule_fit_score),
            routing_rationale: form.routing_rationale || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setDecisions([...decisions, data.routing_decision as RoutingDecision]);
      setSelectedSupplier("");
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function requestQuote(decisionId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/routing-decisions/${decisionId}/request-quote`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setDecisions(
        decisions.map((d) =>
          d.id === decisionId ? (data.routing_decision as RoutingDecision) : d,
        ),
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-100">
          Attached parts ({attachedParts.length})
        </h2>
        {attachedParts.length === 0 ? (
          <p className="text-sm text-slate-400">No parts attached yet.</p>
        ) : (
          <table className="mb-4 w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="py-2">Part #</th>
                <th className="py-2">Name</th>
                <th className="py-2">Process</th>
                <th className="py-2">Material</th>
                <th className="py-2">Qty</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {attachedParts.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-mono text-xs text-slate-200">
                    {p.part_number}
                  </td>
                  <td className="py-2 text-slate-300">{p.part_name ?? "—"}</td>
                  <td className="py-2 text-slate-400">
                    {p.process_required ?? "—"}
                  </td>
                  <td className="py-2 text-slate-400">{p.material ?? "—"}</td>
                  <td className="py-2 tabular-nums text-slate-300">
                    {p.quantity ?? "—"}
                  </td>
                  <td className="py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => detachPart(p.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {unattachedParts.length > 0 ? (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Available parts from this RFQ
            </p>
            <ul className="space-y-1">
              {unattachedParts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-slate-300">
                    {p.part_number}
                  </span>
                  <span className="text-slate-400">{p.part_name ?? "—"}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="ml-auto"
                    disabled={busy}
                    onClick={() => attachPart(p.id)}
                  >
                    Attach
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-slate-100">
            Suggested suppliers ({rankedCandidates.length})
          </h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Ranked by capability · compliance · capacity
          </span>
        </div>
        {rankedCandidates.length === 0 ? (
          <p className="text-sm text-slate-400">
            No approved suppliers on file yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {rankedCandidates.map((c, idx) => {
              const alreadyRouted = alreadyRoutedSupplierIds.has(
                c.organization_id,
              );
              return (
                <li
                  key={c.organization_id}
                  className={`rounded-md border p-3 ${
                    c.blocked
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-slate-800 bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-100">
                          {c.organization_name}
                        </span>
                        {c.blocked && (
                          <StatusBadge tone="danger">Blocked</StatusBadge>
                        )}
                        {alreadyRouted && (
                          <StatusBadge tone="neutral">Routed</StatusBadge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.itar_registered && (
                          <StatusBadge tone="warn" dot={false}>
                            ITAR
                          </StatusBadge>
                        )}
                        {c.as9100_certified && (
                          <StatusBadge tone="info" dot={false}>
                            AS9100
                          </StatusBadge>
                        )}
                        {c.iso9001_certified && (
                          <StatusBadge tone="info" dot={false}>
                            ISO9001
                          </StatusBadge>
                        )}
                        {c.cmmc_status && c.cmmc_status !== "none" && (
                          <StatusBadge tone="info" dot={false}>
                            CMMC{" "}
                            {c.cmmc_status.replace("level_", "L").toUpperCase()}
                          </StatusBadge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ScoreDial label="Composite" value={c.composite_score} />
                      <ScoreDial
                        label="Capability"
                        value={c.capability_fit_score}
                      />
                      <ScoreDial
                        label="Compliance"
                        value={c.compliance_fit_score}
                      />
                      <ScoreDial
                        label="Capacity"
                        value={c.capacity_fit_score}
                      />
                    </div>
                  </div>

                  {(c.match_reasons.length > 0 || c.gap_reasons.length > 0) && (
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                      {c.match_reasons.length > 0 && (
                        <ul className="space-y-0.5">
                          {c.match_reasons.map((r, i) => (
                            <li key={`m-${i}`} className="text-emerald-300/80">
                              ✓ {r}
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.gap_reasons.length > 0 && (
                        <ul className="space-y-0.5">
                          {c.gap_reasons.map((r, i) => (
                            <li key={`g-${i}`} className="text-amber-300/80">
                              ⚠ {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant={alreadyRouted ? "ghost" : "secondary"}
                      size="sm"
                      disabled={busy || alreadyRouted}
                      onClick={() => applyCandidateAsAutofill(c)}
                    >
                      {alreadyRouted ? "Already routed" : "Use these scores →"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-100">
          Routing decisions ({decisions.length})
        </h2>
        {decisions.length === 0 ? (
          <p className="text-sm text-slate-400">No routing decisions yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="py-2">Supplier</th>
                <th className="py-2">Fit (cap/cap/comp/sched)</th>
                <th className="py-2">Status</th>
                <th className="py-2">Rationale</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {decisions.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="py-2 text-slate-200">
                    {candidateName(d.supplier_organization_id)}
                  </td>
                  <td className="py-2 font-mono text-xs text-slate-300">
                    {d.capability_fit_score ?? "—"}/
                    {d.capacity_fit_score ?? "—"}/
                    {d.compliance_fit_score ?? "—"}/
                    {d.schedule_fit_score ?? "—"}
                  </td>
                  <td className="py-2">
                    <StatusBadge
                      tone={
                        d.routing_status === "quote_requested" ? "accent" : "neutral"
                      }
                    >
                      {d.routing_status}
                    </StatusBadge>
                  </td>
                  <td className="max-w-[20rem] py-2 text-xs text-slate-400">
                    {d.routing_rationale ?? "—"}
                  </td>
                  <td className="py-2">
                    {d.routing_status === "pending" ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={busy || attachedParts.length === 0}
                        onClick={() => requestQuote(d.id)}
                      >
                        Request quote
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {d.quote_requested_at
                          ? new Date(d.quote_requested_at).toLocaleString()
                          : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section id="routing-decision-form">
        <h2 className="mb-3 text-base font-semibold text-slate-100">
          Record routing decision
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Pick a supplier (or autofill from a suggestion above) and record fit
          scores. The decision is logged before any quote request goes out.
        </p>
        <form onSubmit={createRoutingDecision} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Supplier
            </span>
            <select
              required
              className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">— select —</option>
              {rankedCandidates.map((c) => (
                <option
                  key={c.organization_id}
                  value={c.organization_id}
                  disabled={alreadyRoutedSupplierIds.has(c.organization_id)}
                >
                  #
                  {rankedCandidates.indexOf(c) + 1} · {c.organization_name} ·{" "}
                  {c.composite_score}
                  {alreadyRoutedSupplierIds.has(c.organization_id)
                    ? " (already routed)"
                    : ""}
                  {c.blocked ? " · blocked" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(
              [
                ["capability_fit_score", "Capability"],
                ["capacity_fit_score", "Capacity"],
                ["compliance_fit_score", "Compliance"],
                ["schedule_fit_score", "Schedule"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {label} (0-100)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Rationale
            </span>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
              value={form.routing_rationale}
              onChange={(e) =>
                setForm({ ...form, routing_rationale: e.target.value })
              }
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={busy || !selectedSupplier}
          >
            {busy ? "Recording…" : "Record routing decision"}
          </Button>
        </form>
      </section>

      {message ? (
        <p
          className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function ScoreDial({ label, value }: { label: string; value: number }) {
  const tone = scoreTone(value);
  const toneClass: Record<string, string> = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  };
  return (
    <div
      className={`min-w-[60px] rounded-md border px-2 py-1 text-center ${toneClass[tone]}`}
    >
      <div className="text-base font-semibold tabular-nums leading-none">
        {value}
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] opacity-80">
        {label}
      </div>
    </div>
  );
}
