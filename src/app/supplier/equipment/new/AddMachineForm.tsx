"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Button, useToast } from "@/components/ui";

export function AddMachineForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [machineType, setMachineType] = useState("");
  const [materials, setMaterials] = useState("");
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineType.trim()) {
      setError("Machine type is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const materialsList = materials
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/supplier/machines", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          machine_type: machineType.trim(),
          materials_supported: materialsList,
          capacity: capacity.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast({
        tone: "success",
        title: "Machine added",
        body: machineType.trim(),
      });
      router.push("/supplier/equipment");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      toast({ tone: "error", title: "Could not save machine", body: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Field label="Machine type" required>
        <input
          value={machineType}
          onChange={(e) => setMachineType(e.target.value)}
          placeholder="e.g. 5-Axis CNC Mill"
          className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
        />
      </Field>
      <Field label="Materials supported (comma-separated)">
        <input
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder="Aluminum, Titanium, Stainless"
          className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
        />
      </Field>
      <Field label="Capacity">
        <input
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="e.g. 2 machines · 80 hrs/wk"
          className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
        />
      </Field>

      {error && <Banner tone="error">{error}</Banner>}

      <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/supplier/equipment")}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={busy}>
          {busy ? "Saving…" : "Save machine"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
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
    </label>
  );
}
