"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_JOB_STATUSES } from "@/lib/jobs/state";
import type { JobStatus } from "@/lib/jobs/types";

export default function AdminJobActions({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const router = useRouter();
  const [override, setOverride] = useState<JobStatus>(status);
  const [note, setNote] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [busy, setBusy] = useState<"status" | "issue" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function setStatus() {
    if (override === status) {
      setMessage("Select a different status.");
      return;
    }
    setBusy("status");
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: override, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMessage(`Overridden to ${override}.`);
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
      const res = await fetch(`/api/admin/jobs/${jobId}/flag-issue`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: issueNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Flag failed");
      setMessage("Risk flagged.");
      setIssueNote("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Flag failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Override status</h2>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={override}
          onChange={(e) => setOverride(e.target.value as JobStatus)}
        >
          {ALL_JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
              {s === status ? " (current)" : ""}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          rows={2}
          placeholder="Override note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          onClick={setStatus}
          disabled={busy !== null}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {busy === "status" ? "Overriding…" : "Apply override"}
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Flag risk</h2>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
          placeholder="Describe the risk or issue"
          value={issueNote}
          onChange={(e) => setIssueNote(e.target.value)}
        />
        <button
          type="button"
          onClick={flagIssue}
          disabled={busy !== null}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {busy === "issue" ? "Flagging…" : "Flag risk"}
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
