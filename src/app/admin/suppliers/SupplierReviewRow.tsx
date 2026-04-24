"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierProfile } from "@/lib/supplier-profile/types";

type Action = "approve" | "reject" | "request-revisions";

const LABEL: Record<Action, string> = {
  approve: "Approve",
  reject: "Reject",
  "request-revisions": "Request revisions",
};

export default function SupplierReviewRow({
  profile,
}: {
  profile: SupplierProfile;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function act(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/supplier-profiles/${profile.id}/${action}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ review_notes: notes || undefined }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const compliance = [
    profile.as9100_certified ? "AS9100" : null,
    profile.iso9001_certified ? "ISO9001" : null,
    profile.itar_registered ? "ITAR" : null,
    profile.cmmc_status !== "none" ? `CMMC:${profile.cmmc_status}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <tr className="border-b align-top">
      <td className="py-3 font-mono text-xs">{profile.organization_id}</td>
      <td className="py-3">{profile.approval_status}</td>
      <td className="py-3">
        {profile.submitted_at
          ? new Date(profile.submitted_at).toLocaleString()
          : "—"}
      </td>
      <td className="py-3 text-xs">{compliance || "—"}</td>
      <td className="py-3">
        <div className="space-y-2">
          <textarea
            placeholder="Review notes (optional)"
            className="w-64 rounded border px-2 py-1 text-xs"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(["approve", "reject", "request-revisions"] as Action[]).map(
              (a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => act(a)}
                  disabled={busy !== null}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  {busy === a ? "…" : LABEL[a]}
                </button>
              ),
            )}
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </td>
    </tr>
  );
}
