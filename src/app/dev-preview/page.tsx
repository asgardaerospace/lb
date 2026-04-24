import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/shell/Logo";

export const dynamic = "force-dynamic";

interface Screen {
  title: string;
  href: string;
  description: string;
  softrOrigin?: string;
  status?: "wired" | "preview" | "blocked";
}

const SCREENS: Record<string, Screen[]> = {
  Admin: [
    {
      title: "Operations Control Center",
      href: "/admin",
      description:
        "System-wide KPIs, live work pipeline, and attention-needed queue.",
      softrOrigin: "Operations Control Center",
      status: "wired",
    },
    {
      title: "Companies",
      href: "/admin/companies",
      description: "Directory of buyers and suppliers on the platform.",
      softrOrigin: "Companies",
      status: "preview",
    },
    {
      title: "Suppliers · Approval Queue",
      href: "/admin/suppliers",
      description: "Review supplier profiles awaiting qualification.",
      softrOrigin: "Suppliers",
      status: "wired",
    },
    {
      title: "Quote Pipeline",
      href: "/admin/quotes",
      description: "Pending, submitted, and under-review quotes.",
      softrOrigin: "Quote Pipeline",
      status: "wired",
    },
    {
      title: "Routing Queue",
      href: "/admin/routing",
      description: "RFQs ready for supplier matching.",
      softrOrigin: "Routing Queue",
      status: "wired",
    },
    {
      title: "RFQ Inbox",
      href: "/admin/rfqs",
      description: "Submitted RFQs awaiting triage.",
      status: "wired",
    },
    {
      title: "Jobs",
      href: "/admin/jobs",
      description: "All production jobs across suppliers.",
      status: "wired",
    },
  ],
  Supplier: [
    {
      title: "Manufacturing Partner Dashboard",
      href: "/supplier",
      description: "Assigned work, pending quotes, and active jobs.",
      softrOrigin: "Supplier Dashboard",
      status: "wired",
    },
    {
      title: "Quote Requests",
      href: "/supplier/quote-requests",
      description: "Routed work packages ready to quote.",
      status: "wired",
    },
    {
      title: "Quotes",
      href: "/supplier/quotes",
      description: "Quote pipeline across RFQs.",
      status: "wired",
    },
    {
      title: "Jobs",
      href: "/supplier/jobs",
      description: "Production commitments owned by the supplier.",
      status: "wired",
    },
    {
      title: "Company Profile",
      href: "/supplier/profile",
      description: "Capability, compliance, and qualification evidence.",
      softrOrigin: "Company Settings",
      status: "wired",
    },
    {
      title: "Equipment",
      href: "/supplier/equipment",
      description: "Machines and capability envelope.",
      softrOrigin: "Company Equipment",
      status: "preview",
    },
    {
      title: "Add Equipment",
      href: "/supplier/equipment/new",
      description: "Declare a new machine (UI-only preview).",
      softrOrigin: "Add Equipment",
      status: "blocked",
    },
  ],
  Buyer: [
    {
      title: "Mission Control",
      href: "/buyer/dashboard",
      description: "Program, RFQ, and production overview.",
      softrOrigin: "Customer Dashboard",
      status: "wired",
    },
    {
      title: "Programs",
      href: "/buyer/programs",
      description: "All programs associated with the buyer organization.",
      softrOrigin: "Programs",
      status: "wired",
    },
    {
      title: "Submit Program",
      href: "/buyer/programs/new",
      description: "Define a new aerospace program.",
      softrOrigin: "Submit Program",
      status: "wired",
    },
    {
      title: "RFQs",
      href: "/buyer/rfqs",
      description: "All RFQs across your programs.",
      status: "wired",
    },
    {
      title: "Production Tracking",
      href: "/buyer/jobs",
      description: "Live status for jobs running against your RFQs.",
      softrOrigin: "Production Tracking",
      status: "wired",
    },
  ],
};

export default function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const total = Object.values(SCREENS).reduce((acc, s) => acc + s.length, 0);

  return (
    <main className="hero-sheen min-h-screen">
      <div className="grid-bg min-h-screen bg-black/10">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <header className="mb-10 flex items-center justify-between">
            <Logo href="/" />
            <Link
              href="/"
              className="text-xs text-slate-400 transition hover:text-slate-200"
            >
              ← Home
            </Link>
          </header>

          <div className="mb-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Dev preview · not available in production
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">
              Launchbelt UI Preview Index
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              All {total} screens grouped by role. Unauthenticated or
              empty-data screens fall back to clearly-labeled preview data.
              This index is hidden in production builds.
            </p>
          </div>

          <div className="space-y-10">
            {Object.entries(SCREENS).map(([role, screens]) => (
              <section key={role}>
                <div className="mb-3 flex items-baseline justify-between border-b border-slate-800 pb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-400">
                    {role} — {screens.length} screens
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {screens.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="group block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-500/30 hover:bg-slate-900/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-slate-100 transition group-hover:text-cyan-300">
                          {s.title}
                        </div>
                        <StatusPill status={s.status ?? "wired"} />
                      </div>
                      <code className="mt-1 block text-[11px] text-slate-500">
                        {s.href}
                      </code>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {s.description}
                      </p>
                      {s.softrOrigin && (
                        <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                          Softr origin · {s.softrOrigin}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-16 border-t border-slate-800 pt-6 text-[11px] text-slate-500">
            Launchbelt — Aerospace manufacturing orchestration · build
            preview only · routed through role layouts
          </footer>
        </div>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: "wired" | "preview" | "blocked" }) {
  const styles = {
    wired: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    preview: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
    blocked: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
  }[status];
  const label = {
    wired: "Live data",
    preview: "Preview data",
    blocked: "UI only",
  }[status];
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}
