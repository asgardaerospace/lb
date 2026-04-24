import { getOptionalUser } from "@/lib/auth";
import { Logo } from "@/components/shell/Logo";

export const dynamic = "force-dynamic";

interface CheckRow {
  label: string;
  value: string;
  ok: boolean;
}

function present(v: string | undefined): boolean {
  return typeof v === "string" && v.length > 0;
}

function masked(v: string | undefined): string {
  if (!present(v)) return "—";
  return `set · ${v!.length} chars`;
}

export default async function DebugRuntimePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "(not set)";
  const branch = process.env.VERCEL_GIT_COMMIT_REF || "(not set)";
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;

  const user = await getOptionalUser();

  // Probe Supabase reachability without leaking errors. We try a no-op
  // query against a public-ish table; the result is "reachable" if the
  // network call returns at all (even if RLS denies the read).
  let supabaseProbe: { ok: boolean; detail: string } = {
    ok: false,
    detail: "skipped (no env vars)",
  };
  if (present(url) && present(anon)) {
    try {
      const { createServerSupabase } = await import("@/lib/supabase/server");
      const sb = await createServerSupabase();
      const { error } = await sb
        .from("users")
        .select("id", { count: "exact", head: true });
      if (error) {
        supabaseProbe = {
          ok: true,
          detail: `network ok · query returned: ${error.message.slice(0, 80)}`,
        };
      } else {
        supabaseProbe = { ok: true, detail: "network ok · query returned" };
      }
    } catch (err) {
      supabaseProbe = {
        ok: false,
        detail: err instanceof Error ? err.message.slice(0, 120) : "unknown",
      };
    }
  }

  const checks: CheckRow[] = [
    {
      label: "NODE_ENV",
      value: env ?? "(unset)",
      ok: env === "production" || env === "development",
    },
    { label: "VERCEL_ENV", value: process.env.VERCEL_ENV ?? "—", ok: true },
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      value: present(url)
        ? `set · host ${(() => {
            try {
              return new URL(url!).host;
            } catch {
              return "invalid url";
            }
          })()}`
        : "MISSING",
      ok: present(url),
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: masked(anon),
      ok: present(anon),
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY",
      value: masked(service),
      ok: present(service),
    },
    {
      label: "Supabase reachability",
      value: supabaseProbe.detail,
      ok: supabaseProbe.ok,
    },
    {
      label: "Authenticated user",
      value: user ? `${user.email} · role ${user.role}` : "(none — preview mode)",
      ok: !!user,
    },
    { label: "Git commit", value: commit, ok: commit !== "(not set)" },
    { label: "Git branch", value: branch, ok: branch !== "(not set)" },
  ];

  return (
    <main className="min-h-screen bg-[#030712] text-slate-200">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Logo href="/" />
          <span className="rounded-md border border-rose-500/25 bg-rose-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300">
            Diagnostic
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Runtime configuration
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Read-only snapshot of environment, Supabase reachability, and the
          current request&apos;s session. No secret values are printed —
          only presence and length. This page is safe to leave deployed
          but can be removed once production is healthy.
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">Check</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {checks.map((c) => (
                <tr key={c.label}>
                  <td className="px-4 py-2.5 text-slate-300">{c.label}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                    {c.value}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${
                        c.ok ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                      aria-label={c.ok ? "ok" : "fail"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
            How to read this
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
            <li>
              <span className="text-slate-300">Three Supabase keys present + reachability ok</span>{" "}
              → preview pages should render with live data when a user is signed in.
            </li>
            <li>
              <span className="text-slate-300">URL/anon missing</span> →
              app falls into preview mode for everyone. Set both in Vercel
              Project Settings → Environment Variables.
            </li>
            <li>
              <span className="text-slate-300">Service role missing</span>{" "}
              → audit log writes and admin-bypass operations will fail.
            </li>
            <li>
              <span className="text-slate-300">Git commit</span> tells you
              which build Vercel actually deployed. If it doesn&apos;t
              match what you pushed, the deployment is stale.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
