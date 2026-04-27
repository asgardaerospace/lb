"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Button } from "@/components/ui";

const MISSION_TYPES = [
  "Aviation",
  "Avionics",
  "Defense",
  "eVTOL",
  "ISR",
  "Logistics",
  "Propulsion",
  "Satellite",
  "Other",
];

const LIFECYCLE_STAGES = ["Prototype", "DVT", "EVT", "LRIP", "Production"];

export interface ProgramCreateDefaults {
  program_name: string;
  program_type: string;
  lifecycle: string;
  itar: boolean;
  cui: boolean;
  cmmc_level: string;
  primary_processes: string[];
  legal_name: string;
}

export default function ProgramCreateForm({
  defaults,
}: {
  defaults?: ProgramCreateDefaults | null;
}) {
  const router = useRouter();
  const [program_name, setName] = useState(defaults?.program_name ?? "");
  const [program_type, setType] = useState(
    defaults && MISSION_TYPES.includes(defaults.program_type)
      ? defaults.program_type
      : "",
  );
  const [lifecycle, setLifecycle] = useState(
    defaults && LIFECYCLE_STAGES.includes(defaults.lifecycle)
      ? defaults.lifecycle
      : "",
  );
  const [description, setDescription] = useState(
    defaults?.primary_processes && defaults.primary_processes.length > 0
      ? `Primary processes (from intake): ${defaults.primary_processes.join(", ")}.`
      : "",
  );
  const [compliance_level, setCompliance] = useState(
    defaults && defaults.cmmc_level && defaults.cmmc_level !== "none"
      ? `CMMC ${defaults.cmmc_level.replace("_", " ")}`
      : "",
  );
  const [itar, setItar] = useState(defaults?.itar ?? false);
  const [cui, setCui] = useState(defaults?.cui ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefilled = !!defaults;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const typeCombined = [program_type, lifecycle].filter(Boolean).join(" · ");
      const res = await fetch("/api/buyer/programs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          program_name,
          program_type: typeCombined || null,
          description: description || null,
          compliance_level: compliance_level || null,
          itar_controlled: itar,
          cui_controlled: cui,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      // Phase 6 success flow: pass ?just_created=1 so the program detail
      // page surfaces the "submit your first RFQ" hint.
      router.push(`/buyer/programs/${data.program.id}?just_created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {prefilled && (
        <div className="rounded-md border border-cyan-500/25 bg-cyan-500/[0.04] px-3.5 py-2.5 text-xs text-cyan-100">
          <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Pre-filled from intake
          </span>
          Mission type, lifecycle stage, and ITAR/CUI flags are populated
          from{" "}
          <span className="font-mono text-cyan-200">
            {defaults?.legal_name}
          </span>
          &apos;s onboarding answers. Adjust anything below before submitting.
        </div>
      )}

      <Field
        label="Program name"
        required
        hint="A human-readable identifier for this program."
      >
        <input
          required
          className="w-full rounded-md border px-3 py-2"
          value={program_name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Mission type" required hint="Primary application domain.">
        <ChipToggleGroup
          options={MISSION_TYPES}
          value={program_type}
          onChange={setType}
        />
      </Field>

      <Field label="Lifecycle stage" required>
        <ChipToggleGroup
          options={LIFECYCLE_STAGES}
          value={lifecycle}
          onChange={setLifecycle}
        />
      </Field>

      <Field
        label="Description"
        required
        hint="System context, intended use, and any programmatic constraints."
      >
        <textarea
          required
          rows={4}
          className="w-full rounded-md border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field
        label="Compliance level"
        hint="Optional — e.g. AS9100, standard."
      >
        <input
          className="w-full rounded-md border px-3 py-2"
          value={compliance_level}
          onChange={(e) => setCompliance(e.target.value)}
          placeholder="AS9100, standard, etc."
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
          Controls
        </legend>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={itar}
            onChange={(e) => setItar(e.target.checked)}
          />
          ITAR controlled
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={cui}
            onChange={(e) => setCui(e.target.checked)}
          />
          CUI controlled
        </label>
      </fieldset>

      <Field label="Program cover image (optional)">
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-800 bg-slate-950/40 py-6 text-center">
          <div className="text-xs text-slate-500">Upload disabled</div>
          <div className="mt-1 text-[11px] text-slate-600">
            Storage layer not yet wired — image uploads will be enabled after task 06.
          </div>
        </div>
      </Field>

      {error && <Banner tone="error">{error}</Banner>}

      <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/buyer/dashboard")}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Creating…" : "Submit program"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {required && <span className="text-rose-400">*</span>}
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </label>
  );
}

function ChipToggleGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? "" : opt)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
