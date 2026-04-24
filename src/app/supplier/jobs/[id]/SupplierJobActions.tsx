"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/lib/jobs/types";

const NEXT: Record<JobStatus, JobStatus | null> = {
  awarded: "scheduled",
  scheduled: "in_production",
  in_production: "inspection",
  inspection: "shipped",
  shipped: "complete",
  complete: null,
};

const LABEL: Record<JobStatus, string> = {
  awarded: "Mark scheduled",
  scheduled: "Start production",
  in_production: "Move to inspection",
  inspection: "Mark shipped",
  shipped: "Mark complete",
  complete: "Complete",
};

export default function SupplierJobActions({
  jobId,
  status,
  canAct,
}: {
  jobId: string;
  status: JobStatus;
  canAct: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [busy, setBusy] = useState<"status" | "issue" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const next = NEXT[status];

  async function advance() {
    if (!next) return;
    setBusy("status");
    setMessage(null);
    try {
      const res = await fetch(`/api/supplier/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMessage(`Status → ${next}.`);
      setNote("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function flagIssue() {
    if (!issueNote.trim()) {
      setMessage("Issue note required.");
      return;
    }
    setBusy("issue");
    setMessage(null);
    try {
      const res = await fetch(`/api/supplier/jobs/${jobId}/flag-issue`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: issueNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Flag failed");
      setMessage("Issue flagged.");
      setIssueNote("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Flag failed");
    } finally {
      setBusy(null);
    }
  }

  if (!canAct) {
    return (
      <p className="text-xs text-gray-500">
        Read-only: only supplier_admin can update status or flag issues.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {next ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Advance status</h2>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={2}
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            onClick={advance}
            disabled={busy !== null}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {busy === "status" ? "Updating…" : LABEL[status]}
          </button>
        </section>
      ) : (
        <p className="text-sm text-gray-600">Job is complete — no further supplier actions.</p>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Flag issue</h2>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
          placeholder="Describe the issue"
          value={issueNote}
          onChange={(e) => setIssueNote(e.target.value)}
        />
        <button
          type="button"
          onClick={flagIssue}
          disabled={busy !== null}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {busy === "issue" ? "Flagging…" : "Flag issue"}
        </button>
      </section>

      {message ? (
        <p className="text-sm text-gray-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
