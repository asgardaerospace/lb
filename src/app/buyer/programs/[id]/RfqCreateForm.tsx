"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RfqPriority } from "@/lib/rfq/types";

export default function RfqCreateForm({ programId }: { programId: string }) {
  const router = useRouter();
  const [rfq_title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [required_delivery_date, setDate] = useState("");
  const [priority, setPriority] = useState<RfqPriority>("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/buyer/programs/${programId}/rfqs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rfq_title,
          description: description || null,
          quantity: quantity ? Number.parseInt(quantity, 10) : null,
          required_delivery_date: required_delivery_date || null,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      router.push(`/buyer/rfqs/${data.rfq.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Title</span>
        <input
          required
          className="w-full rounded border px-3 py-2"
          value={rfq_title}
          onChange={(e) => setTitle(e.target.value)}
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
      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Quantity</span>
          <input
            type="number"
            min={1}
            className="w-full rounded border px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Need by</span>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={required_delivery_date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Priority</span>
          <select
            className="w-full rounded border px-3 py-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value as RfqPriority)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create RFQ"}
      </button>
    </form>
  );
}
