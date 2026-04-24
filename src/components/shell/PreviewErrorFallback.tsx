"use client";

import Link from "next/link";
import { useEffect } from "react";

interface PreviewErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  dashboardHref: string;
  dashboardLabel: string;
}

export function PreviewErrorFallback({
  error,
  reset,
  dashboardHref,
  dashboardLabel,
}: PreviewErrorFallbackProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[preview-error] render fallback:", error);
    }
  }, [error]);

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-6">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
        Preview mode
      </div>
      <h2 className="text-lg font-semibold text-slate-100">
        This screen needs live data to render.
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">
        It relies on an authenticated Supabase session or an organization
        scope that isn&apos;t available in this environment. Real data will
        appear once Supabase environment variables are configured and a
        user is signed in.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          Open {dashboardLabel} preview →
        </Link>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-inset ring-slate-700 transition hover:bg-slate-700"
        >
          Retry
        </button>
        <Link
          href="/dev-preview"
          className="text-xs text-slate-400 transition hover:text-slate-200"
        >
          Screen index
        </Link>
      </div>
      {error?.digest && (
        <p className="mt-4 font-mono text-[10px] text-slate-600">
          trace · {error.digest}
        </p>
      )}
    </div>
  );
}
