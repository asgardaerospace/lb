import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-slate-100 transition hover:text-cyan-300"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="text-cyan-400"
        aria-hidden
      >
        <path
          d="M12 2L3 20h6l3-6 3 6h6L12 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-wide">LAUNCHBELT</span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
          Asgard Aerospace
        </span>
      </div>
    </Link>
  );
}
