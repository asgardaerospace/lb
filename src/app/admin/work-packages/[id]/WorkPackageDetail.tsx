"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Part } from "@/lib/rfq/types";
import type {
  CandidateSupplier,
  RoutingDecision,
} from "@/lib/routing/types";

interface Props {
  workPackageId: string;
  attachedParts: Part[];
  unattachedParts: Part[];
  candidates: CandidateSupplier[];
  initialDecisions: RoutingDecision[];
}

const EMPTY_SCORES = {
  capability_fit_score: "",
  capacity_fit_score: "",
  compliance_fit_score: "",
  schedule_fit_score: "",
  routing_rationale: "",
};

export default function WorkPackageDetail({
  workPackageId,
  attachedParts,
  unattachedParts,
  candidates,
  initialDecisions,
}: Props) {
  const router = useRouter();
  const [decisions, setDecisions] = useState<RoutingDecision[]>(initialDecisions);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [form, setForm] = useState<typeof EMPTY_SCORES>(EMPTY_SCORES);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const alreadyRoutedSupplierIds = new Set(
    decisions.map((d) => d.supplier_organization_id),
  );

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
      setForm(EMPTY_SCORES);
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

  const candidateName = (orgId: string) =>
    candidates.find((c) => c.organization_id === orgId)?.organization_name ??
    orgId;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">
          Attached parts ({attachedParts.length})
        </h2>
        {attachedParts.length === 0 ? (
          <p className="text-sm text-gray-600">No parts attached yet.</p>
        ) : (
          <table className="mb-4 w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2">Part #</th>
                <th className="py-2">Name</th>
                <th className="py-2">Process</th>
                <th className="py-2">Qty</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {attachedParts.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{p.part_number}</td>
                  <td className="py-2">{p.part_name ?? "—"}</td>
                  <td className="py-2">{p.process_required ?? "—"}</td>
                  <td className="py-2">{p.quantity ?? "—"}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => detachPart(p.id)}
                      className="text-xs text-red-600 underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {unattachedParts.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Available parts from this RFQ:</p>
            <ul className="space-y-1">
              {unattachedParts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs">{p.part_number}</span>
                  <span>{p.part_name ?? "—"}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => attachPart(p.id)}
                    className="ml-auto rounded border px-2 py-0.5 text-xs"
                  >
                    Attach
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Routing decisions ({decisions.length})
        </h2>
        {decisions.length === 0 ? (
          <p className="text-sm text-gray-600">No routing decisions yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2">Supplier</th>
                <th className="py-2">Fit (cap/cap/comp/sched)</th>
                <th className="py-2">Status</th>
                <th className="py-2">Rationale</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} className="border-b align-top">
                  <td className="py-2">{candidateName(d.supplier_organization_id)}</td>
                  <td className="py-2 font-mono text-xs">
                    {d.capability_fit_score ?? "—"}/
                    {d.capacity_fit_score ?? "—"}/
                    {d.compliance_fit_score ?? "—"}/
                    {d.schedule_fit_score ?? "—"}
                  </td>
                  <td className="py-2">{d.routing_status}</td>
                  <td className="py-2 max-w-[20rem] text-xs">
                    {d.routing_rationale ?? "—"}
                  </td>
                  <td className="py-2">
                    {d.routing_status === "pending" ? (
                      <button
                        type="button"
                        disabled={busy || attachedParts.length === 0}
                        onClick={() => requestQuote(d.id)}
                        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                      >
                        Request quote
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">
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

      <section>
        <h2 className="mb-3 text-lg font-medium">Candidate suppliers</h2>
        <p className="mb-3 text-xs text-gray-500">
          Approved suppliers. Select one and fill in fit scores to record a
          routing decision.
        </p>
        <form onSubmit={createRoutingDecision} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Supplier</span>
            <select
              required
              className="w-full rounded border px-3 py-2"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">— select —</option>
              {candidates.map((c) => (
                <option
                  key={c.organization_id}
                  value={c.organization_id}
                  disabled={alreadyRoutedSupplierIds.has(c.organization_id)}
                >
                  {c.organization_name}
                  {alreadyRoutedSupplierIds.has(c.organization_id)
                    ? " (already routed)"
                    : ""}
                  {c.itar_registered ? " · ITAR" : ""}
                  {c.as9100_certified ? " · AS9100" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {(
              [
                ["capability_fit_score", "Capability"],
                ["capacity_fit_score", "Capacity"],
                ["compliance_fit_score", "Compliance"],
                ["schedule_fit_score", "Schedule"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-xs font-medium">
                  {label} (0-100)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Rationale</span>
            <textarea
              rows={3}
              className="w-full rounded border px-3 py-2"
              value={form.routing_rationale}
              onChange={(e) =>
                setForm({ ...form, routing_rationale: e.target.value })
              }
            />
          </label>
          <button
            type="submit"
            disabled={busy || !selectedSupplier}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? "Recording…" : "Record routing decision"}
          </button>
        </form>
      </section>

      {message ? (
        <p className="text-sm text-gray-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
