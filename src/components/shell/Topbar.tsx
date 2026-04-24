import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  crumbs?: Crumb[];
  right?: React.ReactNode;
}

export function Topbar({ crumbs = [], right }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#050a14]/80 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        {crumbs.length === 0 ? (
          <span>&nbsp;</span>
        ) : (
          <ol className="flex items-center gap-1.5">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-700">/</span>}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="transition hover:text-slate-300"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-300">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </nav>
      <div className="flex items-center gap-3">{right}</div>
    </header>
  );
}
