"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Button, useToast } from "@/components/ui";

interface Machine {
  id: string;
  machine_type: string;
  materials_supported: string[];
  capacity: string | null;
}

interface Capability {
  id: string;
  process_type: string;
  materials_supported: string[];
}

interface Props {
  initialMachines: Machine[];
  initialCapabilities: Capability[];
  canEdit: boolean;
}

type Mode = "machine" | "capability";

export function EquipmentManager({
  initialMachines,
  initialCapabilities,
  canEdit,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [machines, setMachines] = useState(initialMachines);
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // capability inline-add form
  const [capProcess, setCapProcess] = useState("");
  const [capMaterials, setCapMaterials] = useState("");

  async function remove(mode: Mode, id: string, label: string) {
    if (!confirm(`Remove ${label}?`)) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/${mode}s/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      if (mode === "machine") {
        setMachines((rows) => rows.filter((r) => r.id !== id));
      } else {
        setCapabilities((rows) => rows.filter((r) => r.id !== id));
      }
      toast({ tone: "success", title: `Removed ${label}` });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
      toast({ tone: "error", title: "Could not remove", body: msg });
    } finally {
      setBusy(null);
    }
  }

  async function addCapability(e: React.FormEvent) {
    e.preventDefault();
    if (!capProcess.trim()) {
      setError("Process type is required");
      return;
    }
    setBusy("__cap_new__");
    setError(null);
    try {
      const materials = capMaterials
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/supplier/capabilities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          process_type: capProcess.trim(),
          materials_supported: materials,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Add failed");
      setCapabilities((rows) => [data.capability as Capability, ...rows]);
      setCapProcess("");
      setCapMaterials("");
      toast({
        tone: "success",
        title: "Capability added",
        body: capProcess.trim(),
      });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Add failed";
      setError(msg);
      toast({ tone: "error", title: "Could not add capability", body: msg });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && <Banner tone="error">{error}</Banner>}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Machines</h3>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {machines.length} on file
          </span>
        </div>
        {machines.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
            No machines on file. Use “+ Add Equipment” to declare your first
            machine.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800 bg-slate-900/40">
            {machines.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-100">
                    {m.machine_type}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {m.materials_supported.length > 0
                      ? m.materials_supported.join(", ")
                      : "No materials listed"}
                    {m.capacity ? ` · ${m.capacity}` : ""}
                  </div>
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy === m.id}
                    onClick={() => remove("machine", m.id, m.machine_type)}
                  >
                    {busy === m.id ? "…" : "Remove"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Capabilities</h3>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {capabilities.length} declared
          </span>
        </div>
        {capabilities.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
            No process capabilities declared yet. Capabilities power routing
            matches alongside machines.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800 bg-slate-900/40">
            {capabilities.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-100">
                    {c.process_type}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {c.materials_supported.length > 0
                      ? c.materials_supported.join(", ")
                      : "No materials listed"}
                  </div>
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy === c.id}
                    onClick={() => remove("capability", c.id, c.process_type)}
                  >
                    {busy === c.id ? "…" : "Remove"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <form
            onSubmit={addCapability}
            className="grid gap-3 rounded-md border border-slate-800 bg-slate-950/40 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Process type
              </span>
              <input
                type="text"
                value={capProcess}
                onChange={(e) => setCapProcess(e.target.value)}
                placeholder="e.g. Anodize Type II"
                className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Materials (comma-separated)
              </span>
              <input
                type="text"
                value={capMaterials}
                onChange={(e) => setCapMaterials(e.target.value)}
                placeholder="Aluminum, Titanium"
                className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={busy === "__cap_new__"}
            >
              {busy === "__cap_new__" ? "Adding…" : "Add capability"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
