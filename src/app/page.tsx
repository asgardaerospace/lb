import Link from "next/link";
import { Logo } from "@/components/shell/Logo";

const entries: {
  href: string;
  role: string;
  title: string;
  description: string;
}[] = [
  {
    href: "/admin",
    role: "Asgard Admin",
    title: "Operations Control Center",
    description:
      "Route work packages, review supplier onboarding, track quote pipeline, and oversee active jobs across programs.",
  },
  {
    href: "/supplier",
    role: "Supplier",
    title: "Manufacturing Partner Console",
    description:
      "Maintain company profile, respond to quote requests, and report production progress against assigned jobs.",
  },
  {
    href: "/buyer/dashboard",
    role: "Buyer (OEM)",
    title: "Mission Control",
    description:
      "Create programs, submit RFQs, and track production progress across the Launchbelt supplier network.",
  },
];

export default function Home() {
  return (
    <main className="hero-sheen min-h-screen">
      <div className="grid-bg min-h-screen bg-black/10">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-8 py-10">
          <header className="flex items-center justify-between">
            <Logo href="/" />
            <Link
              href="/dev-preview"
              className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/10"
            >
              Dev Preview
            </Link>
          </header>

          <section className="mt-20 max-w-3xl">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
              Launchbelt · Aerospace Manufacturing Orchestration
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
              Route aerospace work with the discipline of a control center.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-400">
              A production backbone for qualified supplier networks — buyer
              intake, routing, quoting, and execution under one authoritative
              system of record.
            </p>
          </section>

          <section className="mt-14 mb-8 grid gap-3 md:grid-cols-3">
            {entries.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 p-5 transition hover:border-cyan-500/30 hover:bg-slate-900/80"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  {e.role}
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-100">
                  {e.title}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {e.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-slate-400 transition group-hover:text-cyan-300">
                  Enter console
                  <span aria-hidden>→</span>
                </div>
              </Link>
            ))}
          </section>

          <footer className="mt-auto flex items-center justify-between border-t border-slate-800 pt-5 text-[11px] text-slate-500">
            <span>
              Unauthenticated visits redirect back here. Dev sign-in: see{" "}
              <code className="rounded bg-slate-900 px-1 py-0.5 text-slate-300">
                docs/08_SUPABASE_SETUP.md §7
              </code>
            </span>
            <span className="uppercase tracking-[0.22em]">Asgard Aerospace</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
