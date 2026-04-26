import Link from "next/link";

interface BackLinkProps {
  href: string;
  label?: string;
  className?: string;
}

/**
 * Compact "← back to X" link rendered above page headers on detail screens.
 * Pair with PageHeader's `back` prop, or use standalone above any custom shell.
 */
export function BackLink({ href, label = "Back", className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`mb-2 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-200 ${className}`}
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </Link>
  );
}
