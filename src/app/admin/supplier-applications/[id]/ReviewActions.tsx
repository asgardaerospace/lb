"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  SUPPLIER_REVIEW_ACTIONS,
  type SupplierApplicationStatus,
  type SupplierReviewAction,
} from "@/lib/supplier-application/types";

type ScoreState = "idle" | "running" | "ok" | "err";

const LABEL: Record<SupplierReviewAction, string> = {
  mark_under_review: "Mark under review",
  request_info: "Request revisions",
  approve: "Approve",
  reject: "Reject",
};

const VARIANT: Record<SupplierReviewAction, "primary" | "secondary" | "danger"> = {
  mark_under_review: "secondary",
  request_info: "secondary",
  approve: "primary",
  reject: "danger",
};

const REQUIRES_NOTES: SupplierReviewAction[] = ["request_info", "reject"];

const TERMINAL: SupplierApplicationStatus[] = [
  "approved",
  "rejected",
  "withdrawn",
];

export default function ReviewActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: SupplierApplicationStatus;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<SupplierReviewAction | null>(null);
  const [message, setMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  const [scoreState, setScoreState] = useState<ScoreState>("idle");
  const [scoreMessage, setScoreMessage] = useState<string | null>(null);

  const terminal = TERMINAL.includes(status);

  async function generateScore() {
    setScoreState("running");
    setScoreMessage(null);
    try {
      const res = await fetch(
        `/api/admin/supplier-applications/${applicationId}/score`,
        { method: "POST" },
      );
      const parsed = (await res.json().catch(() => ({}))) as {
        score?: { composite_score: number; recommendation: string | null };
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setScoreState("err");
        setScoreMessage(
          parsed.message ?? parsed.error ?? `Score failed (${res.status})`,
        );
        return;
      }
      setScoreState("ok");
      setScoreMessage(
        parsed.score
          ? `Stored composite ${parsed.score.composite_score} · ${parsed.score.recommendation ?? "defer"}.`
          : "Score updated.",
      );
      router.refresh();
    } catch (err) {
      setScoreState("err");
      setScoreMessage(err instanceof Error ? err.message : "Network error");
    }
  }

  async function act(action: SupplierReviewAction) {
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
        `/api/admin/supplier-applications/${applicationId}/status`,
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
        application?: { status: SupplierApplicationStatus };
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
      <section className="space-y-4">
        <p className="text-sm text-slate-400">
          This application is{" "}
          <span className="font-mono text-slate-200">
            {status.replace("_", " ")}
          </span>{" "}
          — no further state changes are available from this screen.
        </p>
        <ScoreControl
          state={scoreState}
          message={scoreMessage}
          onClick={generateScore}
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Reviewer notes
          <span className="ml-2 normal-case tracking-normal text-slate-600">
            required for &ldquo;Request revisions&rdquo; and &ldquo;Reject&rdquo;
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
        {SUPPLIER_REVIEW_ACTIONS.map((action) => (
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

      <div className="border-t border-slate-800 pt-3">
        <ScoreControl
          state={scoreState}
          message={scoreMessage}
          onClick={generateScore}
        />
      </div>
    </section>
  );
}

function ScoreControl({
  state,
  message,
  onClick,
}: {
  state: ScoreState;
  message: string | null;
  onClick: () => void;
}) {
  const running = state === "running";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" onClick={onClick} disabled={running}>
        {running ? "Scoring…" : "Generate / refresh readiness score"}
      </Button>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
        Re-running is safe — UPSERTs the row + appends an audit entry.
      </span>
      {message && (
        <span
          role={state === "err" ? "alert" : "status"}
          className={`text-xs ${
            state === "err" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
