"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Button, Card } from "@/components/ui";
import {
  CMMC_LEVELS,
  type SupplierApplicationPayload,
} from "@/lib/supplier-application/types";
import {
  blankPayload,
  clearDraft,
  loadDraft,
  saveDraft,
  saveSubmission,
} from "./draftStorage";

const INPUT_CLS =
  "w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-700 focus:outline-none";

const PROCESS_OPTIONS = [
  "CNC machining",
  "Sheet metal",
  "Composites",
  "Additive manufacturing",
  "EDM",
  "Welding",
  "Heat treat",
  "NDT",
  "Coatings",
  "Harnessing",
  "Assembly",
];

type Cap = SupplierApplicationPayload["capabilities"][number];
type Machine = SupplierApplicationPayload["machines"][number];
type Cert = SupplierApplicationPayload["certifications"][number];
type PP = SupplierApplicationPayload["past_performance"][number];

export function SupplierApplicationForm() {
  const router = useRouter();
  const [payload, setPayload] = useState<SupplierApplicationPayload>(() =>
    blankPayload(),
  );
  const [intakeEmail, setIntakeEmail] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayload(draft.payload);
      setIntakeEmail(draft.intakeEmail);
      setSavedAt(new Date(draft.savedAt));
      setRestored(true);
    }
    setHydrated(true);
  }, []);

  // Persist on change (debounced).
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      const at = saveDraft(payload, intakeEmail);
      setSavedAt(at);
    }, 400);
    return () => window.clearTimeout(t);
  }, [payload, intakeEmail, hydrated]);

  function reset() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Reset this draft? Everything you've entered in this browser will be cleared.",
      )
    ) {
      return;
    }
    clearDraft();
    setPayload(blankPayload());
    setIntakeEmail("");
    setSavedAt(null);
  }

  async function submit() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    saveDraft(payload, intakeEmail);
    try {
      const res = await fetch("/api/supplier-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intake_email: intakeEmail.trim() || null,
          payload_schema_version: 1,
          payload,
        }),
      });
      let parsed: {
        application_id?: string | null;
        status?: string | null;
        legal_name?: string | null;
        preview_mode?: boolean;
        error?: string;
        message?: string;
        details?: string;
      } = {};
      try {
        parsed = await res.json();
      } catch {
        // ignore
      }
      if (!res.ok) {
        setError(
          parsed.message ??
            parsed.details ??
            parsed.error ??
            `Submission failed (${res.status})`,
        );
        setSubmitting(false);
        return;
      }
      saveSubmission({
        applicationId: parsed.application_id ?? null,
        status: parsed.status ?? (parsed.preview_mode ? "preview" : "submitted"),
        legalName: parsed.legal_name ?? payload.company.legal_name,
        previewMode: !!parsed.preview_mode,
        payload,
      });
      clearDraft();
      router.push("/apply/supplier/confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  // ──────────── Mutators ────────────
  const updateCompany = <K extends keyof SupplierApplicationPayload["company"]>(
    key: K,
    value: SupplierApplicationPayload["company"][K],
  ) =>
    setPayload((p) => ({ ...p, company: { ...p.company, [key]: value } }));

  const updateCompliance = (
    patch: Partial<SupplierApplicationPayload["compliance"]>,
  ) =>
    setPayload((p) => ({
      ...p,
      compliance: { ...p.compliance, ...patch },
    }));

  const togglePrimaryProcess = (proc: string) =>
    setPayload((p) => {
      const has = p.primary_processes.includes(proc);
      return {
        ...p,
        primary_processes: has
          ? p.primary_processes.filter((x) => x !== proc)
          : [...p.primary_processes, proc],
      };
    });

  const submitDisabled = useMemo(
    () =>
      submitting ||
      !payload.company.legal_name.trim() ||
      payload.primary_processes.length === 0,
    [submitting, payload.company.legal_name, payload.primary_processes],
  );

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-md border border-amber-500/25 bg-amber-500/[0.04] px-4 py-2.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-300">
          Preview intake
        </span>
        <span className="ml-2 text-[12px] text-amber-200/85">
          Responses are saved to your browser as you type. Submission
          persists to the supplier application tables when Supabase is
          configured; otherwise the flow runs UI-only.
        </span>
        {restored && (
          <span className="ml-2 hidden font-mono text-[11px] text-amber-300/70 sm:inline">
            · resumed from local draft
          </span>
        )}
      </div>

      {/* Section 1 — Company */}
      <Card>
        <SectionTitle index="01" title="Company" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Legal name" required>
            <input
              required
              className={INPUT_CLS}
              value={payload.company.legal_name}
              onChange={(e) => updateCompany("legal_name", e.target.value)}
              placeholder="Acme Aerospace, Inc."
            />
          </Field>
          <Field label="DBA">
            <input
              className={INPUT_CLS}
              value={payload.company.dba ?? ""}
              onChange={(e) => updateCompany("dba", e.target.value || null)}
            />
          </Field>
          <Field label="Website">
            <input
              className={INPUT_CLS}
              value={payload.company.website ?? ""}
              onChange={(e) =>
                updateCompany("website", e.target.value || null)
              }
              placeholder="acme.com"
            />
          </Field>
          <Field label="Year founded">
            <input
              className="form-input font-mono"
              value={String(payload.company.year_founded ?? "")}
              onChange={(e) =>
                updateCompany("year_founded", e.target.value || null)
              }
              placeholder="1998"
            />
          </Field>
          <Field label="HQ city">
            <input
              className={INPUT_CLS}
              value={payload.company.hq_city ?? ""}
              onChange={(e) =>
                updateCompany("hq_city", e.target.value || null)
              }
            />
          </Field>
          <Field label="HQ state / region">
            <input
              className={INPUT_CLS}
              value={payload.company.hq_state ?? ""}
              onChange={(e) =>
                updateCompany("hq_state", e.target.value || null)
              }
              placeholder="CA"
            />
          </Field>
          <Field label="HQ country">
            <input
              className={INPUT_CLS}
              value={payload.company.hq_country}
              onChange={(e) => updateCompany("hq_country", e.target.value)}
            />
          </Field>
          <Field label="Team size">
            <input
              className="form-input font-mono"
              value={String(payload.company.team_size ?? "")}
              onChange={(e) =>
                updateCompany("team_size", e.target.value || null)
              }
              placeholder="48"
            />
          </Field>
          <Field label="DUNS">
            <input
              className="form-input font-mono"
              value={payload.company.duns ?? ""}
              onChange={(e) =>
                updateCompany("duns", e.target.value || null)
              }
            />
          </Field>
          <Field label="CAGE code">
            <input
              className="form-input font-mono"
              value={payload.company.cage ?? ""}
              onChange={(e) =>
                updateCompany("cage", e.target.value || null)
              }
            />
          </Field>
        </div>
      </Card>

      {/* Section 2 — Compliance & primary processes */}
      <Card>
        <SectionTitle index="02" title="Compliance & primary processes" />
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={payload.compliance.itar_registered}
              onChange={(e) =>
                updateCompliance({ itar_registered: e.target.checked })
              }
            />
            ITAR registered
          </label>
          <Field label="CMMC level" inline>
            <select
              className={INPUT_CLS}
              value={payload.compliance.cmmc_level}
              onChange={(e) =>
                updateCompliance({
                  cmmc_level: e.target
                    .value as SupplierApplicationPayload["compliance"]["cmmc_level"],
                })
              }
            >
              {CMMC_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
            Primary processes <span className="text-rose-400">*</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROCESS_OPTIONS.map((p) => {
              const on = payload.primary_processes.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePrimaryProcess(p)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    on
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Section 3 — Capabilities */}
      <Card>
        <SectionTitle
          index="03"
          title="Capabilities"
          subtitle="Process × material matrix the network will route against."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPayload((p) => ({
                  ...p,
                  capabilities: [
                    ...p.capabilities,
                    { process_type: "", materials: [], notes: null },
                  ],
                }))
              }
            >
              + Add capability
            </Button>
          }
        />
        {payload.capabilities.length === 0 && (
          <p className="text-xs text-slate-500">
            No capabilities yet — add one above.
          </p>
        )}
        <div className="space-y-2.5">
          {payload.capabilities.map((c, i) => (
            <CapabilityRow
              key={i}
              row={c}
              onChange={(patch) =>
                setPayload((p) => ({
                  ...p,
                  capabilities: p.capabilities.map((r, j) =>
                    j === i ? { ...r, ...patch } : r,
                  ),
                }))
              }
              onRemove={() =>
                setPayload((p) => ({
                  ...p,
                  capabilities: p.capabilities.filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </Card>

      {/* Section 4 — Machines */}
      <Card>
        <SectionTitle
          index="04"
          title="Machine inventory"
          subtitle="Used by routing for capacity matching."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPayload((p) => ({
                  ...p,
                  machines: [
                    ...p.machines,
                    {
                      machine_type: "",
                      manufacturer: null,
                      model: null,
                      envelope: null,
                      axis_count: null,
                      tolerance_capability: null,
                      materials_supported: [],
                      count: 1,
                    },
                  ],
                }))
              }
            >
              + Add machine
            </Button>
          }
        />
        {payload.machines.length === 0 && (
          <p className="text-xs text-slate-500">No machines listed.</p>
        )}
        <div className="space-y-2.5">
          {payload.machines.map((m, i) => (
            <MachineRow
              key={i}
              row={m}
              onChange={(patch) =>
                setPayload((p) => ({
                  ...p,
                  machines: p.machines.map((r, j) =>
                    j === i ? { ...r, ...patch } : r,
                  ),
                }))
              }
              onRemove={() =>
                setPayload((p) => ({
                  ...p,
                  machines: p.machines.filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </Card>

      {/* Section 5 — Certifications */}
      <Card>
        <SectionTitle
          index="05"
          title="Certifications"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPayload((p) => ({
                  ...p,
                  certifications: [
                    ...p.certifications,
                    {
                      cert_type: "",
                      issuer: null,
                      issued_date: null,
                      expiration_date: null,
                      certificate_no: null,
                    },
                  ],
                }))
              }
            >
              + Add certification
            </Button>
          }
        />
        {payload.certifications.length === 0 && (
          <p className="text-xs text-slate-500">No certifications listed.</p>
        )}
        <div className="space-y-2.5">
          {payload.certifications.map((c, i) => (
            <CertRow
              key={i}
              row={c}
              onChange={(patch) =>
                setPayload((p) => ({
                  ...p,
                  certifications: p.certifications.map((r, j) =>
                    j === i ? { ...r, ...patch } : r,
                  ),
                }))
              }
              onRemove={() =>
                setPayload((p) => ({
                  ...p,
                  certifications: p.certifications.filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </Card>

      {/* Section 6 — Past performance */}
      <Card>
        <SectionTitle
          index="06"
          title="Past performance"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPayload((p) => ({
                  ...p,
                  past_performance: [
                    ...p.past_performance,
                    {
                      customer_name: "",
                      program_name: null,
                      contract_type: null,
                      year_start: null,
                      year_end: null,
                      contract_value_usd: null,
                      references_contact: null,
                    },
                  ],
                }))
              }
            >
              + Add reference
            </Button>
          }
        />
        {payload.past_performance.length === 0 && (
          <p className="text-xs text-slate-500">
            No prior program references listed.
          </p>
        )}
        <div className="space-y-2.5">
          {payload.past_performance.map((p, i) => (
            <PastPerfRow
              key={i}
              row={p}
              onChange={(patch) =>
                setPayload((cur) => ({
                  ...cur,
                  past_performance: cur.past_performance.map((r, j) =>
                    j === i ? { ...r, ...patch } : r,
                  ),
                }))
              }
              onRemove={() =>
                setPayload((cur) => ({
                  ...cur,
                  past_performance: cur.past_performance.filter(
                    (_, j) => j !== i,
                  ),
                }))
              }
            />
          ))}
        </div>
      </Card>

      {/* Section 7 — Submit */}
      <Card>
        <SectionTitle index="07" title="Submit" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Contact email"
            hint="Required for follow-up if you're not signed in."
          >
            <input
              type="email"
              className={INPUT_CLS}
              value={intakeEmail}
              onChange={(e) => setIntakeEmail(e.target.value)}
              placeholder="ops@acme.com"
            />
          </Field>
          <div className="flex items-end justify-between">
            <span className="font-mono text-[11px] text-slate-500">
              {savedAt ? (
                <>
                  Saved locally{" "}
                  {savedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : (
                "Draft not yet saved"
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset draft
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <Banner tone="error">{error}</Banner>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            disabled={submitDisabled}
            onClick={submit}
          >
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        </div>
        <p className="mt-2 text-right text-[11px] text-slate-500">
          Legal name + at least one primary process required.
        </p>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Repeating-row components
// ────────────────────────────────────────────────────────────────────────────

function CapabilityRow({
  row,
  onChange,
  onRemove,
}: {
  row: Cap;
  onChange: (patch: Partial<Cap>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid items-end gap-2 rounded-md border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <Field label="Process" inline>
        <input
          className={INPUT_CLS}
          value={row.process_type}
          onChange={(e) => onChange({ process_type: e.target.value })}
          placeholder="CNC machining"
        />
      </Field>
      <Field label="Materials" hint="Comma-separated">
        <input
          className={INPUT_CLS}
          value={row.materials.join(", ")}
          onChange={(e) =>
            onChange({
              materials: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Al 7075, Ti-6Al-4V"
        />
      </Field>
      <Field label="Notes" inline>
        <input
          className={INPUT_CLS}
          value={row.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value || null })}
        />
      </Field>
      <Button size="sm" variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

function MachineRow({
  row,
  onChange,
  onRemove,
}: {
  row: Machine;
  onChange: (patch: Partial<Machine>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid items-end gap-2 rounded-md border border-slate-800 bg-slate-950/40 p-3 md:grid-cols-[1.2fr_1fr_1fr_120px_120px_auto]">
      <Field label="Type">
        <input
          className={INPUT_CLS}
          value={row.machine_type}
          onChange={(e) => onChange({ machine_type: e.target.value })}
          placeholder="5-axis CNC mill"
        />
      </Field>
      <Field label="Manufacturer">
        <input
          className={INPUT_CLS}
          value={row.manufacturer ?? ""}
          onChange={(e) =>
            onChange({ manufacturer: e.target.value || null })
          }
          placeholder="DMG Mori"
        />
      </Field>
      <Field label="Model">
        <input
          className={INPUT_CLS}
          value={row.model ?? ""}
          onChange={(e) => onChange({ model: e.target.value || null })}
        />
      </Field>
      <Field label="Axes">
        <input
          className="form-input font-mono"
          value={String(row.axis_count ?? "")}
          onChange={(e) =>
            onChange({ axis_count: e.target.value || null })
          }
          placeholder="5"
        />
      </Field>
      <Field label="Count">
        <input
          className="form-input font-mono"
          value={String(row.count ?? "")}
          onChange={(e) => onChange({ count: e.target.value || null })}
          placeholder="2"
        />
      </Field>
      <Button size="sm" variant="ghost" onClick={onRemove}>
        Remove
      </Button>
      <Field label="Materials supported" hint="Comma-separated">
        <input
          className={INPUT_CLS}
          value={(row.materials_supported ?? []).join(", ")}
          onChange={(e) =>
            onChange({
              materials_supported: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Al 6061, Al 7075, Ti-6Al-4V"
        />
      </Field>
      <Field label="Tolerance capability">
        <input
          className="form-input font-mono"
          value={row.tolerance_capability ?? ""}
          onChange={(e) =>
            onChange({ tolerance_capability: e.target.value || null })
          }
          placeholder="±0.0005 in"
        />
      </Field>
      <Field label="Envelope">
        <input
          className={INPUT_CLS}
          value={row.envelope ?? ""}
          onChange={(e) => onChange({ envelope: e.target.value || null })}
          placeholder='40" × 24" × 18"'
        />
      </Field>
    </div>
  );
}

function CertRow({
  row,
  onChange,
  onRemove,
}: {
  row: Cert;
  onChange: (patch: Partial<Cert>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid items-end gap-2 rounded-md border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <Field label="Type">
        <input
          className={INPUT_CLS}
          value={row.cert_type}
          onChange={(e) => onChange({ cert_type: e.target.value })}
          placeholder="AS9100D"
        />
      </Field>
      <Field label="Issuer">
        <input
          className={INPUT_CLS}
          value={row.issuer ?? ""}
          onChange={(e) => onChange({ issuer: e.target.value || null })}
        />
      </Field>
      <Field label="Cert no.">
        <input
          className="form-input font-mono"
          value={row.certificate_no ?? ""}
          onChange={(e) =>
            onChange({ certificate_no: e.target.value || null })
          }
        />
      </Field>
      <Field label="Expires">
        <input
          type="date"
          className="form-input font-mono"
          value={row.expiration_date ?? ""}
          onChange={(e) =>
            onChange({ expiration_date: e.target.value || null })
          }
        />
      </Field>
      <Button size="sm" variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

function PastPerfRow({
  row,
  onChange,
  onRemove,
}: {
  row: PP;
  onChange: (patch: Partial<PP>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid items-end gap-2 rounded-md border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[1.2fr_1fr_120px_120px_140px_auto]">
      <Field label="Customer">
        <input
          className={INPUT_CLS}
          value={row.customer_name}
          onChange={(e) => onChange({ customer_name: e.target.value })}
          placeholder="USAF"
        />
      </Field>
      <Field label="Program">
        <input
          className={INPUT_CLS}
          value={row.program_name ?? ""}
          onChange={(e) =>
            onChange({ program_name: e.target.value || null })
          }
        />
      </Field>
      <Field label="Year start">
        <input
          className="form-input font-mono"
          value={String(row.year_start ?? "")}
          onChange={(e) =>
            onChange({ year_start: e.target.value || null })
          }
          placeholder="2022"
        />
      </Field>
      <Field label="Year end">
        <input
          className="form-input font-mono"
          value={String(row.year_end ?? "")}
          onChange={(e) =>
            onChange({ year_end: e.target.value || null })
          }
        />
      </Field>
      <Field label="Value (USD)">
        <input
          className="form-input font-mono"
          value={String(row.contract_value_usd ?? "")}
          onChange={(e) =>
            onChange({ contract_value_usd: e.target.value || null })
          }
          placeholder="2400000"
        />
      </Field>
      <Button size="sm" variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Lightweight primitives shared with the form
// ────────────────────────────────────────────────────────────────────────────

function SectionTitle({
  index,
  title,
  subtitle,
  action,
}: {
  index: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <div>
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Section {index}
        </div>
        <h2 className="mt-0.5 text-base font-semibold text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  inline,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <label className={`block ${inline ? "flex items-center gap-2" : ""}`}>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </div>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      )}
    </label>
  );
}
