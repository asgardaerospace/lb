"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Quote } from "@/lib/quotes/types";

interface Props {
  routingDecisionId: string;
  existing: Quote | null;
  canAct: boolean;
}

export default function QuoteResponseForm({
  routingDecisionId,
  existing,
  canAct,
}: Props) {
  const router = useRouter();
  const [quoted_price, setPrice] = useState("");
  const [lead_time_days, setLead] = useState("");
  const [minimum_order_quantity, setMoq] = useState("");
  const [quote_notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (existing) {
    return (
      <section className="rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Your response</h2>
        <p className="mb-2 text-sm">
          Status: <span className="font-mono">{existing.status}</span>
        </p>
        {existing.status === "declined" ? (
          <p className="text-sm text-gray-600">
            You declined this quote request.
            {existing.quote_notes ? ` Reason: ${existing.quote_notes}` : ""}
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Price</dt>
            <dd>{existing.quoted_price ?? "—"}</dd>
            <dt className="text-gray-500">Lead time (days)</dt>
            <dd>{existing.lead_time_days ?? "—"}</dd>
            <dt className="text-gray-500">Min order qty</dt>
            <dd>{existing.minimum_order_quantity ?? "—"}</dd>
            <dt className="text-gray-500">Notes</dt>
            <dd>{existing.quote_notes ?? "—"}</dd>
            {existing.review_notes ? (
              <>
                <dt className="text-gray-500">Admin review notes</dt>
                <dd>{existing.review_notes}</dd>
              </>
            ) : null}
          </dl>
        )}
      </section>
    );
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/supplier/quote-requests/${routingDecisionId}/submit-quote`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            quoted_price: quoted_price || null,
            lead_time_days: lead_time_days
              ? Number.parseInt(lead_time_days, 10)
              : null,
            minimum_order_quantity: minimum_order_quantity
              ? Number.parseInt(minimum_order_quantity, 10)
              : null,
            quote_notes: quote_notes || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setMessage("Quote submitted.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function declineRequest() {
    if (!confirm("Decline this quote request?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/supplier/quote-requests/${routingDecisionId}/decline`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            quote_notes: quote_notes || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Decline failed");
      setMessage("Quote request declined.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Decline failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitQuote} className="space-y-4">
      <h2 className="text-lg font-medium">Submit a quote</h2>
      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Price (USD)</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="^\d+(\.\d{1,2})?$"
            className="w-full rounded border px-3 py-2"
            value={quoted_price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={!canAct}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Lead time (days)</span>
          <input
            type="number"
            min={0}
            className="w-full rounded border px-3 py-2"
            value={lead_time_days}
            onChange={(e) => setLead(e.target.value)}
            disabled={!canAct}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Min order qty</span>
          <input
            type="number"
            min={1}
            className="w-full rounded border px-3 py-2"
            value={minimum_order_quantity}
            onChange={(e) => setMoq(e.target.value)}
            disabled={!canAct}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Notes</span>
        <textarea
          rows={3}
          className="w-full rounded border px-3 py-2"
          value={quote_notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!canAct}
        />
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy || !canAct}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Working…" : "Submit quote"}
        </button>
        <button
          type="button"
          onClick={declineRequest}
          disabled={busy || !canAct}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Decline request
        </button>
      </div>
      {message ? (
        <p className="text-sm text-gray-700" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
