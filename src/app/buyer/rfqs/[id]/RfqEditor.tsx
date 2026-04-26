"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import type { Part, Rfq } from "@/lib/rfq/types";

interface Props {
  rfq: Rfq;
  initialParts: Part[];
}

const EMPTY_PART = {
  part_number: "",
  part_name: "",
  revision: "",
  material: "",
  process_required: "",
  quantity: "",
  tolerance_notes: "",
  finish_requirements: "",
  inspection_requirements: "",
};

type OverrideValue = "inherit" | "true" | "false";

function overrideToValue(v: boolean | null): OverrideValue {
  if (v === true) return "true";
  if (v === false) return "false";
  return "inherit";
}

function valueToOverride(v: OverrideValue): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

export default function RfqEditor({ rfq, initialParts }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [form, setForm] = useState<typeof EMPTY_PART>(EMPTY_PART);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [itarOverride, setItarOverride] = useState<OverrideValue>(
    overrideToValue(rfq.itar_override),
  );
  const [cuiOverride, setCuiOverride] = useState<OverrideValue>(
    overrideToValue(rfq.cui_override),
  );

  async function saveOverride(field: "itar_override" | "cui_override", value: OverrideValue) {
    const payload: Record<string, boolean | null> = {
      [field]: valueToOverride(value),
    };
    try {
      const res = await fetch(`/api/buyer/rfqs/${rfq.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast({
        tone: "success",
        title: `${field === "itar_override" ? "ITAR" : "CUI"} setting updated`,
      });
      router.refresh();
    } catch (err) {
      toast({
        tone: "error",
        title: "Could not update compliance",
        body: err instanceof Error ? err.message : "Save failed",
      });
    }
  }

  const editable = rfq.status === "draft";

  async function addPart(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/buyer/rfqs/${rfq.id}/parts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          part_number: form.part_number,
          part_name: form.part_name || null,
          revision: form.revision || null,
          material: form.material || null,
          process_required: form.process_required || null,
          quantity: form.quantity ? Number.parseInt(form.quantity, 10) : null,
          tolerance_notes: form.tolerance_notes || null,
          finish_requirements: form.finish_requirements || null,
          inspection_requirements: form.inspection_requirements || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Add failed");
      setParts([...parts, data.part as Part]);
      setForm(EMPTY_PART);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePart(partId: string) {
    if (!confirm("Remove this part?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/buyer/rfqs/${rfq.id}/parts/${partId}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setParts(parts.filter((p) => p.id !== partId));
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/buyer/rfqs/${rfq.id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setMessage("RFQ submitted.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  const upd =
    <K extends keyof typeof EMPTY_PART>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">Compliance</h2>
        <p className="mb-3 text-xs text-slate-500">
          Per-RFQ override for ITAR + CUI. Leave on &ldquo;Inherit from
          program&rdquo; to use the parent program&apos;s flag, or override
          either way for this specific RFQ. Routing scoring honors the
          effective value.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <ComplianceSelect
            label="ITAR"
            value={itarOverride}
            disabled={!editable}
            onChange={(v) => {
              setItarOverride(v);
              void saveOverride("itar_override", v);
            }}
          />
          <ComplianceSelect
            label="CUI"
            value={cuiOverride}
            disabled={!editable}
            onChange={(v) => {
              setCuiOverride(v);
              void saveOverride("cui_override", v);
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Parts ({parts.length})</h2>
        {parts.length === 0 ? (
          <p className="text-sm text-gray-600">No parts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2">Part #</th>
                <th className="py-2">Name</th>
                <th className="py-2">Material</th>
                <th className="py-2">Process</th>
                <th className="py-2">Qty</th>
                {editable ? <th className="py-2"></th> : null}
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{p.part_number}</td>
                  <td className="py-2">{p.part_name ?? "—"}</td>
                  <td className="py-2">{p.material ?? "—"}</td>
                  <td className="py-2">{p.process_required ?? "—"}</td>
                  <td className="py-2">{p.quantity ?? "—"}</td>
                  {editable ? (
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removePart(p.id)}
                        disabled={busy}
                        className="text-xs text-red-600 underline"
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editable ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">Add part</h2>
          <form onSubmit={addPart} className="grid grid-cols-2 gap-4">
            <Field label="Part number" required>
              <input
                required
                className="w-full rounded border px-3 py-2"
                value={form.part_number}
                onChange={upd("part_number")}
              />
            </Field>
            <Field label="Part name">
              <input
                className="w-full rounded border px-3 py-2"
                value={form.part_name}
                onChange={upd("part_name")}
              />
            </Field>
            <Field label="Revision">
              <input
                className="w-full rounded border px-3 py-2"
                value={form.revision}
                onChange={upd("revision")}
              />
            </Field>
            <Field label="Material">
              <input
                className="w-full rounded border px-3 py-2"
                value={form.material}
                onChange={upd("material")}
              />
            </Field>
            <Field label="Process required">
              <input
                className="w-full rounded border px-3 py-2"
                value={form.process_required}
                onChange={upd("process_required")}
              />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min={1}
                className="w-full rounded border px-3 py-2"
                value={form.quantity}
                onChange={upd("quantity")}
              />
            </Field>
            <Field label="Tolerance notes" full>
              <textarea
                rows={2}
                className="w-full rounded border px-3 py-2"
                value={form.tolerance_notes}
                onChange={upd("tolerance_notes")}
              />
            </Field>
            <Field label="Finish requirements" full>
              <textarea
                rows={2}
                className="w-full rounded border px-3 py-2"
                value={form.finish_requirements}
                onChange={upd("finish_requirements")}
              />
            </Field>
            <Field label="Inspection requirements" full>
              <textarea
                rows={2}
                className="w-full rounded border px-3 py-2"
                value={form.inspection_requirements}
                onChange={upd("inspection_requirements")}
              />
            </Field>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded border px-4 py-2 disabled:opacity-50"
              >
                {busy ? "Adding…" : "Add part"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <p className="text-xs text-gray-500">
          Document upload placeholder — CAD, drawings, and supporting
          documentation will attach to this RFQ once the storage layer is
          wired up.
        </p>
        {editable ? (
          <button
            type="button"
            onClick={submit}
            disabled={busy || parts.length === 0}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            Submit RFQ for routing
          </button>
        ) : (
          <p className="text-sm text-gray-600">
            RFQ has been submitted and is read-only.
          </p>
        )}
        {message ? (
          <p className="text-sm text-gray-700" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function ComplianceSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: OverrideValue;
  disabled?: boolean;
  onChange: (v: OverrideValue) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as OverrideValue)}
        className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none disabled:opacity-50"
      >
        <option value="inherit">Inherit from program</option>
        <option value="true">Required for this RFQ</option>
        <option value="false">Not required for this RFQ</option>
      </select>
    </label>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
