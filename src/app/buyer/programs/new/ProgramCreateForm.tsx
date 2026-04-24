"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgramCreateForm() {
  const router = useRouter();
  const [program_name, setName] = useState("");
  const [program_type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [compliance_level, setCompliance] = useState("");
  const [itar, setItar] = useState(false);
  const [cui, setCui] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/buyer/programs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          program_name,
          program_type: program_type || null,
          description: description || null,
          compliance_level: compliance_level || null,
          itar_controlled: itar,
          cui_controlled: cui,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      router.push(`/buyer/programs/${data.program.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Program name">
        <input
          required
          className="w-full rounded border px-3 py-2"
          value={program_name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Program type">
        <input
          className="w-full rounded border px-3 py-2"
          value={program_type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g. prototype, production"
        />
      </Field>
      <Field label="Description">
        <textarea
          rows={4}
          className="w-full rounded border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Compliance level">
        <input
          className="w-full rounded border px-3 py-2"
          value={compliance_level}
          onChange={(e) => setCompliance(e.target.value)}
          placeholder="e.g. AS9100, standard"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={itar}
          onChange={(e) => setItar(e.target.checked)}
        />
        ITAR controlled
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cui}
          onChange={(e) => setCui(e.target.checked)}
        />
        CUI controlled
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create program"}
      </button>
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
