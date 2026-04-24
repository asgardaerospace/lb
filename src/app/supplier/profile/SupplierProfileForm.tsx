"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CmmcStatus,
  SupplierProfile,
} from "@/lib/supplier-profile/types";
import { EDITABLE_STATES } from "@/lib/supplier-profile/state";

interface Props {
  initial: SupplierProfile | null;
  canEdit: boolean;
}

interface FormState {
  company_summary: string;
  facility_size_sqft: string;
  employee_count: string;
  quality_system_notes: string;
  capacity_notes: string;
  as9100_certified: boolean;
  iso9001_certified: boolean;
  itar_registered: boolean;
  cmmc_status: CmmcStatus;
}

function toForm(p: SupplierProfile | null): FormState {
  return {
    company_summary: p?.company_summary ?? "",
    facility_size_sqft: p?.facility_size_sqft?.toString() ?? "",
    employee_count: p?.employee_count?.toString() ?? "",
    quality_system_notes: p?.quality_system_notes ?? "",
    capacity_notes: p?.capacity_notes ?? "",
    as9100_certified: p?.as9100_certified ?? false,
    iso9001_certified: p?.iso9001_certified ?? false,
    itar_registered: p?.itar_registered ?? false,
    cmmc_status: p?.cmmc_status ?? "none",
  };
}

function toPayload(s: FormState) {
  const intOrNull = (v: string) =>
    v.trim() === "" ? null : Number.parseInt(v, 10);
  return {
    company_summary: s.company_summary || null,
    facility_size_sqft: intOrNull(s.facility_size_sqft),
    employee_count: intOrNull(s.employee_count),
    quality_system_notes: s.quality_system_notes || null,
    capacity_notes: s.capacity_notes || null,
    as9100_certified: s.as9100_certified,
    iso9001_certified: s.iso9001_certified,
    itar_registered: s.itar_registered,
    cmmc_status: s.cmmc_status,
  };
}

export default function SupplierProfileForm({ initial, canEdit }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const status = initial?.approval_status ?? "draft";
  const editable = canEdit && EDITABLE_STATES.includes(status);
  const canSubmit = canEdit && (status === "draft" || status === "revisions_requested");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function saveDraft() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage("Draft saved.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitForReview() {
    setBusy(true);
    setMessage(null);
    try {
      const saveRes = await fetch("/api/supplier/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      if (!saveRes.ok) {
        const e = await saveRes.json();
        throw new Error(e.error ?? "Save failed");
      }
      const submitRes = await fetch("/api/supplier/profile/submit", {
        method: "POST",
      });
      const data = await submitRes.json();
      if (!submitRes.ok) throw new Error(data.error ?? "Submit failed");
      setMessage("Profile submitted for review.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Field label="Company summary">
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={4}
          value={form.company_summary}
          onChange={(e) => update("company_summary", e.target.value)}
          disabled={!editable}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Facility size (sqft)">
          <input
            type="number"
            min={0}
            className="w-full rounded border px-3 py-2"
            value={form.facility_size_sqft}
            onChange={(e) => update("facility_size_sqft", e.target.value)}
            disabled={!editable}
          />
        </Field>
        <Field label="Employee count">
          <input
            type="number"
            min={0}
            className="w-full rounded border px-3 py-2"
            value={form.employee_count}
            onChange={(e) => update("employee_count", e.target.value)}
            disabled={!editable}
          />
        </Field>
      </div>

      <Field label="Quality system notes">
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={3}
          value={form.quality_system_notes}
          onChange={(e) => update("quality_system_notes", e.target.value)}
          disabled={!editable}
        />
      </Field>

      <Field label="Capacity notes">
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={3}
          value={form.capacity_notes}
          onChange={(e) => update("capacity_notes", e.target.value)}
          disabled={!editable}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Compliance</legend>
        <Checkbox
          label="AS9100 certified"
          checked={form.as9100_certified}
          onChange={(v) => update("as9100_certified", v)}
          disabled={!editable}
        />
        <Checkbox
          label="ISO 9001 certified"
          checked={form.iso9001_certified}
          onChange={(v) => update("iso9001_certified", v)}
          disabled={!editable}
        />
        <Checkbox
          label="ITAR registered"
          checked={form.itar_registered}
          onChange={(v) => update("itar_registered", v)}
          disabled={!editable}
        />
        <Field label="CMMC status">
          <select
            className="rounded border px-3 py-2"
            value={form.cmmc_status}
            onChange={(e) =>
              update("cmmc_status", e.target.value as CmmcStatus)
            }
            disabled={!editable}
          >
            <option value="none">None</option>
            <option value="level_1">Level 1</option>
            <option value="level_2">Level 2</option>
            <option value="level_3">Level 3</option>
          </select>
        </Field>
      </fieldset>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={saveDraft}
          disabled={busy || !editable}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={submitForReview}
          disabled={busy || !canSubmit}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Submit for review
        </button>
      </div>

      {message ? (
        <p className="text-sm text-gray-700" role="status">
          {message}
        </p>
      ) : null}

      {!canEdit ? (
        <p className="text-xs text-gray-500">
          Read-only: only Supplier Admin users may edit this profile.
        </p>
      ) : null}
    </form>
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
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
