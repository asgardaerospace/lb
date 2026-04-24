"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/lib/quotes/types";

export default function QuoteReviewActions({
  quoteId,
  status,
}: {
  quoteId: string;
  status: QuoteStatus;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const terminal = ["accepted", "rejected", "declined"].includes(status);

  async function act(action: "accept" | "reject") {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ review_notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      if (action === "accept" && data.job) {
        setMessage(`Accepted. Job ${data.job.id} created.`);
      } else {
        setMessage(action === "accept" ? "Accepted." : "Rejected.");
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (terminal) {
    return (
      <p className="text-sm text-gray-600">
        This quote is {status} — no further action.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <textarea
        placeholder="Review notes (optional)"
        className="w-full rounded border px-3 py-2 text-sm"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => act("accept")}
          disabled={busy !== null}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy === "accept" ? "Accepting…" : "Accept (create job)"}
        </button>
        <button
          type="button"
          onClick={() => act("reject")}
          disabled={busy !== null}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-gray-700" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
