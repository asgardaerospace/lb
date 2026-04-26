type BannerTone = "error" | "warning" | "info" | "success";

const TONE: Record<BannerTone, string> = {
  error:
    "border-rose-500/25 bg-rose-500/10 text-rose-200",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-200",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-200",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
};

const ICON: Record<BannerTone, string> = {
  error: "⚠",
  warning: "⚠",
  info: "ℹ",
  success: "✓",
};

interface BannerProps {
  tone?: BannerTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Compact one-line variant. Defaults to false for the standard padded form. */
  dense?: boolean;
}

export function Banner({
  tone = "error",
  title,
  children,
  action,
  className = "",
  dense,
}: BannerProps) {
  const padding = dense ? "px-3 py-1.5" : "px-3 py-2";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border ${padding} text-xs ${TONE[tone]} ${className}`}
    >
      <span className="mt-0.5 select-none text-sm leading-none" aria-hidden>
        {ICON[tone]}
      </span>
      <div className="min-w-0 flex-1">
        {title && (
          <div className="text-[13px] font-semibold leading-snug">{title}</div>
        )}
        {children && (
          <div className={title ? "mt-0.5 text-[12px] opacity-90" : ""}>
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
