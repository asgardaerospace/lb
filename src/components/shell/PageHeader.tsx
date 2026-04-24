interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <section className="hero-sheen relative mb-6 overflow-hidden rounded-xl border border-slate-800/80">
      <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex items-end justify-between gap-4 px-6 py-7">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
