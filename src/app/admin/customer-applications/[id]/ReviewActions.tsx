"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  REVIEW_ACTIONS,
  type CustomerApplicationStatus,
  type ReviewAction,
} from "@/lib/customer-application/types";

const LABEL: Record<ReviewAction, string> = {
  mark_under_review: "Mark under review",
  request_info: "Request more info",
  approve: "Approve",
  reject: "Reject",
};

const VARIANT: Record<ReviewAction, "primary" | "secondary" | "danger"> = {
  mark_under_review: "secondary",
  request_info: "secondary",
  approve: "primary",
  reject: "danger",
};

const REQUIRES_NOTES: ReviewAction[] = ["request_info", "reject"];

const TERMINAL: CustomerApplicationStatus[] = [
  "approved",
  "rejected",
  "withdrawn",
];

export default function ReviewActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: CustomerApplicationStatus;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<ReviewAction | null>(null);
  const [message, setMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  const terminal = TERMINAL.includes(status);

  async function act(action: ReviewAction) {
    if (REQUIRES_NOTES.includes(action) && !notes.trim()) {
      setMessage({
        tone: "err",
        text: `${LABEL[action]} requires reviewer notes.`,
      });
      return;
    }
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/customer-applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action,
            notes: notes.trim() || null,
          }),
        },
      );
      let parsed: {
        application?: { status: CustomerApplicationStatus };
        error?: string;
        message?: string;
        details?: string;
      } = {};
      try {
        parsed = await res.json();
      } catch {
        // ignore
      }
      if (!res.ok) {
        const text =
          parsed.message ?? parsed.details ?? parsed.error ?? `Action failed (${res.status})`;
        setMessage({ tone: "err", text });
        setBusy(null);
        return;
      }
      const newStatus = parsed.application?.status ?? action;
      setMessage({
        tone: "ok",
        text: `Status updated to ${newStatus.replace("_", " ")}.`,
      });
      setNotes("");
      router.refresh();
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBusy(null);
    }
  }

  if (terminal) {
    return (
      <p className="text-sm text-slate-400">
        This application is{" "}
        <span className="font-mono text-slate-200">
          {status.replace("_", " ")}
        </span>{" "}
        — no further action is available from this screen.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Reviewer notes
          <span className="ml-2 normal-case tracking-normal text-slate-600">
            required for &ldquo;Request more info&rdquo; and &ldquo;Reject&rdquo;
          </span>
        </span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you decide and why? Anything the applicant or future reviewers should know."
          className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-700 focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {REVIEW_ACTIONS.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={VARIANT[action]}
            onClick={() => act(action)}
            disabled={busy !== null}
          >
            {busy === action ? "Working…" : LABEL[action]}
          </Button>
        ))}
      </div>

      {message && (
        <p
          role={message.tone === "err" ? "alert" : "status"}
          className={`text-xs ${
            message.tone === "err" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
