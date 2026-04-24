interface EmptyStateProps {
  title?: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Nothing here yet",
  body,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/30 px-6 py-12 text-center">
      <div className="mb-3 text-slate-600">
        {icon ?? (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <rect
              x="4"
              y="6"
              width="16"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4 10h16"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>
      <div className="text-sm font-medium text-slate-300">{title}</div>
      {body && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{body}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
