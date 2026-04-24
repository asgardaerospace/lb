export function PreviewModeBanner() {
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-md border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-amber-200"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="mt-0.5 shrink-0 text-amber-400"
        aria-hidden
      >
        <path
          d="M12 3L2 20h20L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 10v5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
      </svg>
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
          Preview mode
        </div>
        <p className="mt-0.5 text-xs text-amber-200/80">
          Connect Supabase and sign in to load live data. Screens render
          illustrative preview data until a session is established.
        </p>
      </div>
    </div>
  );
}
