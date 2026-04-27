"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, StatusBadge } from "@/components/ui";
import type {
  InviteHistoryEntry,
  InviteResult,
  OperationalUserRow,
} from "@/lib/customer-application/invite-repository";

export function CustomerAccessPanel({
  applicationId,
  defaultEmail,
  initialUsers,
  initialHistory,
  organizationName,
}: {
  applicationId: string;
  defaultEmail: string;
  initialUsers: OperationalUserRow[];
  initialHistory: InviteHistoryEntry[];
  organizationName: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function invite() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/admin/customer-applications/${applicationId}/invite`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      const parsed = (await res.json().catch(() => ({}))) as {
        invite?: InviteResult;
        error?: string;
        message?: string;
        details?: string;
      };
      if (!res.ok) {
        setError(
          parsed.message ?? parsed.details ?? parsed.error ?? `Invite failed (${res.status})`,
        );
        return;
      }
      if (parsed.invite) {
        setResult(parsed.invite);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/40 p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Customer access
      </div>

      {/* Invite form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && email.trim()) invite();
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label className="flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Invite email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="primary@customer.example"
            className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-700 focus:outline-none"
          />
        </label>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={busy || !email.trim()}
        >
          {busy ? "Inviting…" : "Invite to platform"}
        </Button>
      </form>

      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
        Provisions a buyer_admin user for {organizationName}. If email/auth is
        not wired in this environment, the invite is recorded as a placeholder.
      </p>

      {result && <InviteResultBanner result={result} />}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-200"
        >
          {error}
        </p>
      )}

      {/* Existing users */}
      <div className="mt-5">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Users on this organization ({initialUsers.length})
        </div>
        {initialUsers.length === 0 ? (
          <p className="text-xs text-slate-500">
            No users yet — invite the customer above.
          </p>
        ) : (
          <ul className="space-y-1">
            {initialUsers.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs"
              >
                <span className="font-mono text-slate-200">{u.email}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone="info" dot={false}>
                    {u.role}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      u.status === "active"
                        ? "success"
                        : u.status === "invited"
                          ? "warn"
                          : "neutral"
                    }
                    dot={false}
                  >
                    {u.status}
                  </StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite history */}
      {initialHistory.length > 0 && (
        <div className="mt-5">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Invite history ({initialHistory.length})
          </div>
          <ul className="space-y-1">
            {initialHistory.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs"
              >
                <span>
                  <span className="font-mono text-slate-200">
                    {h.email ?? "—"}
                  </span>
                  <span className="ml-2 text-slate-500">
                    by{" "}
                    {h.invited_by_email ??
                      (h.invited_by ? h.invited_by.slice(0, 8) : "system")}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {h.placeholder_mode && (
                    <StatusBadge tone="warn" dot={false}>
                      Placeholder
                    </StatusBadge>
                  )}
                  <StatusBadge
                    tone={h.placeholder_mode ? "neutral" : "info"}
                    dot={false}
                  >
                    {h.outcome}
                  </StatusBadge>
                  <span className="font-mono text-[10.5px] text-slate-500">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InviteResultBanner({ result }: { result: InviteResult }) {
  const isPlaceholder = result.placeholder_mode;
  return (
    <div
      role="status"
      className={`mt-3 rounded-md border px-3 py-2 text-xs ${
        isPlaceholder
          ? "border-amber-500/30 bg-amber-500/[0.08] text-amber-200"
          : "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200"
      }`}
    >
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]">
        {isPlaceholder ? "Placeholder invite recorded" : "Invite sent"}
      </div>
      <div className="mt-0.5">{result.message}</div>
      {isPlaceholder && (
        <div className="mt-1 text-[11px] text-amber-200/80">
          Action required: provision the auth user in Supabase Dashboard
          (or wire `SUPABASE_SERVICE_ROLE_KEY` + email infra) to complete
          the invite. The audit log captured the intent.
        </div>
      )}
    </div>
  );
}
