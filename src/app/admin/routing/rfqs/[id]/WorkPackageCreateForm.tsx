"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkPackageCreateForm({ rfqId }: { rfqId: string }) {
  const router = useRouter();
  const [package_name, setName] = useState("");
  const [package_type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rfqs/${rfqId}/work-packages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package_name,
          package_type: package_type || null,
          description: description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      router.push(`/admin/work-packages/${data.work_package.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Package name</span>
        <input
          required
          className="w-full rounded border px-3 py-2"
          value={package_name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Type</span>
        <input
          className="w-full rounded border px-3 py-2"
          value={package_type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g. machined, sheet_metal, assembly"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Description</span>
        <textarea
          rows={3}
          className="w-full rounded border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create work package"}
      </button>
    </form>
  );
}
