"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierProfile } from "@/lib/supplier-profile/types";
import { StatusBadge, mapStatus, supplierStatusMap, Button } from "@/components/ui";

type Action = "approve" | "reject" | "request-revisions";

const LABEL: Record<Action, string> = {
  approve: "Approve",
  reject: "Reject",
  "request-revisions": "Request revisions",
};

const VARIANT: Record<Action, "primary" | "danger" | "secondary"> = {
  approve: "primary",
  reject: "danger",
  "request-revisions": "secondary",
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
  ].filter(Boolean);

  const { label, tone } = mapStatus(supplierStatusMap, profile.approval_status);

  return (
    <tr className="align-top">
      <td className="px-4 py-3 font-mono text-xs text-slate-400">
        {profile.organization_id.slice(0, 8)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {profile.submitted_at
          ? new Date(profile.submitted_at).toLocaleString()
          : "—"}
      </td>
      <td className="px-4 py-3">
        {compliance.length === 0 ? (
          <span className="text-xs text-slate-500">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {compliance.map((c) => (
              <StatusBadge key={c!} tone="info" dot={false}>
                {c}
              </StatusBadge>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <textarea
            placeholder="Review notes (optional)"
            className="w-72 rounded-md border px-3 py-2 text-xs"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(["approve", "reject", "request-revisions"] as Action[]).map(
              (a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={VARIANT[a]}
                  onClick={() => act(a)}
                  disabled={busy !== null}
                >
                  {busy === a ? "…" : LABEL[a]}
                </Button>
              ),
            )}
          </div>
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </div>
      </td>
    </tr>
  );
}
