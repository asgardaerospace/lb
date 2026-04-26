"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/shell/Logo";

type Role = "all" | "admin" | "supplier" | "buyer";
type ScreenStatus = "wired" | "preview" | "blocked";

interface Screen {
  title: string;
  href: string;
  description: string;
  status: ScreenStatus;
}

interface WalkthroughStep {
  role: "buyer" | "admin" | "supplier";
  title: string;
  href: string;
  detail: string;
}

interface Walkthrough {
  title: string;
  intro: string;
  steps: WalkthroughStep[];
}

interface Scenario {
  title: string;
  body: string;
  role: "buyer" | "admin" | "supplier";
  href: string;
}

const SCREENS: Record<Exclude<Role, "all">, Screen[]> = {
  admin: [
    {
      title: "Operations Control Center",
      href: "/admin",
      description: "System-wide KPIs, live work pipeline, and attention queue.",
      status: "wired",
    },
    {
      title: "Companies",
      href: "/admin/companies",
      description:
        "Searchable, filterable, sortable directory of every buyer + supplier.",
      status: "wired",
    },
    {
      title: "Suppliers · Approval Queue",
      href: "/admin/suppliers",
      description: "Review supplier profiles awaiting qualification.",
      status: "wired",
    },
    {
      title: "Quote Pipeline",
      href: "/admin/quotes",
      description: "Pending, submitted, and under-review quotes.",
      status: "wired",
    },
    {
      title: "Routing Queue",
      href: "/admin/routing",
      description: "RFQs ready for supplier matching.",
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
  supplier: [
    {
      title: "Manufacturing Partner Dashboard",
      href: "/supplier",
      description:
        "Active jobs, quote win rate, response time, pending quotes.",
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
      status: "wired",
    },
    {
      title: "Equipment",
      href: "/supplier/equipment",
      description: "Machines + capabilities — drives routing match scoring.",
      status: "wired",
    },
    {
      title: "Add Equipment",
      href: "/supplier/equipment/new",
      description: "Declare a new machine in the capability envelope.",
      status: "wired",
    },
  ],
  buyer: [
    {
      title: "Customer Onboarding (Apply)",
      href: "/onboarding",
      description:
        "9-step intake — company, programs, mfg, compliance, posture, supply chain, data, first-use, review. Drafts persist in browser. Alias: /apply/customer.",
      status: "preview",
    },
    {
      title: "Onboarding · Confirmation",
      href: "/onboarding/confirmation",
      description:
        "Post-submission state — provisioning checklist + CTAs. Reads the latest local draft snapshot.",
      status: "preview",
    },
    {
      title: "Mission Control",
      href: "/buyer/dashboard",
      description: "Programs active, RFQs submitted, in-routing, in production.",
      status: "wired",
    },
    {
      title: "Programs",
      href: "/buyer/programs",
      description: "All programs associated with the buyer organization.",
      status: "wired",
    },
    {
      title: "Submit Program",
      href: "/buyer/programs/new",
      description: "Define a new aerospace program.",
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
      status: "wired",
    },
  ],
};

const WALKTHROUGHS: Walkthrough[] = [
  {
    title: "End-to-end lifecycle",
    intro:
      "Trace a single piece of work from buyer intake through supplier production. Each step opens the screen the matching role would see.",
    steps: [
      {
        role: "buyer",
        title: "Submit a program",
        href: "/buyer/programs/new",
        detail:
          "Buyer creates the program — parent container for all RFQs and parts.",
      },
      {
        role: "buyer",
        title: "Create + submit an RFQ",
        href: "/buyer/rfqs",
        detail:
          "Buyer adds parts, attaches drawings, submits. Notifies Asgard admins.",
      },
      {
        role: "admin",
        title: "Triage in the routing queue",
        href: "/admin/routing",
        detail:
          "Asgard reviews the submitted RFQ and assembles work packages.",
      },
      {
        role: "admin",
        title: "Score + route to suppliers",
        href: "/admin/routing",
        detail:
          "Routing intelligence ranks approved suppliers by capability, compliance, capacity. Admin records routing decisions and requests quotes.",
      },
      {
        role: "supplier",
        title: "Respond to the quote request",
        href: "/supplier/quote-requests",
        detail:
          "Supplier sees the work package in their inbox, submits a quote.",
      },
      {
        role: "admin",
        title: "Accept the winning quote",
        href: "/admin/quotes",
        detail:
          "Asgard reviews submitted quotes. Acceptance creates the job and notifies supplier + buyer.",
      },
      {
        role: "supplier",
        title: "Run production with the digital traveler",
        href: "/supplier/jobs",
        detail:
          "Supplier moves the job through scheduled → in-production → inspection → complete. Each transition records a traveler step.",
      },
      {
        role: "buyer",
        title: "Track production live",
        href: "/buyer/jobs",
        detail:
          "Buyer sees real-time job status, traveler progress, and the full document chain.",
      },
    ],
  },
  {
    title: "Supplier onboarding + capability declaration",
    intro:
      "How a supplier organization becomes routing-eligible.",
    steps: [
      {
        role: "supplier",
        title: "Complete the company profile",
        href: "/supplier/profile",
        detail:
          "Capability narrative, certifications (AS9100/ISO9001/ITAR/CMMC), capacity notes.",
      },
      {
        role: "supplier",
        title: "Declare equipment + capabilities",
        href: "/supplier/equipment",
        detail:
          "Machines and processes feed the routing scoring engine directly.",
      },
      {
        role: "admin",
        title: "Asgard reviews + approves",
        href: "/admin/suppliers",
        detail:
          "Admin queue: approve, request revisions, or reject. Approved suppliers enter the candidate pool.",
      },
      {
        role: "admin",
        title: "Confirm in the directory",
        href: "/admin/companies",
        detail:
          "Filter by certification status to confirm the new supplier is approved + visible.",
      },
    ],
  },
];

const SCENARIOS: Scenario[] = [
  {
    title: "New customer onboarding intake",
    body: "Multi-step configuration wizard at /onboarding (alias /apply/customer). Drafts auto-persist locally; reset clears them.",
    role: "buyer",
    href: "/onboarding",
  },
  {
    title: "Buyer with programs in flight",
    body: "Mission control with KPIs, recent RFQs, and any production tracking.",
    role: "buyer",
    href: "/buyer/dashboard",
  },
  {
    title: "Buyer creating a new program",
    body: "Empty form with the 'what happens next' aside.",
    role: "buyer",
    href: "/buyer/programs/new",
  },
  {
    title: "Asgard admin triaging the routing queue",
    body: "RFQs submitted by buyers, ready to assemble into work packages.",
    role: "admin",
    href: "/admin/routing",
  },
  {
    title: "Asgard admin scoring + routing suppliers",
    body: "Open a routing RFQ, create a work package, see ranked candidates with capability/compliance/capacity dials.",
    role: "admin",
    href: "/admin/routing",
  },
  {
    title: "Asgard admin reviewing pending quotes",
    body: "Submitted supplier quotes awaiting accept/reject.",
    role: "admin",
    href: "/admin/quotes",
  },
  {
    title: "Supplier with open quote requests",
    body: "Inbox of routed work packages with priority + need-by dates.",
    role: "supplier",
    href: "/supplier/quote-requests",
  },
  {
    title: "Supplier running production",
    body: "Job list with progress bars; click into one to see the digital traveler.",
    role: "supplier",
    href: "/supplier/jobs",
  },
  {
    title: "Supplier maintaining capabilities",
    body: "Add/remove machines and process capabilities — drives routing match.",
    role: "supplier",
    href: "/supplier/equipment",
  },
];

const ROLE_STYLES: Record<"admin" | "supplier" | "buyer", string> = {
  admin: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  supplier: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  buyer: "border-violet-500/30 bg-violet-500/10 text-violet-200",
};

const ROLE_LABEL: Record<"admin" | "supplier" | "buyer", string> = {
  admin: "Asgard admin",
  supplier: "Supplier",
  buyer: "Buyer",
};

export function DevPreviewClient() {
  const [role, setRole] = useState<Role>("all");

  const screens =
    role === "all"
      ? Object.entries(SCREENS) as Array<[Exclude<Role, "all">, Screen[]]>
      : ([[role, SCREENS[role]]] as Array<[Exclude<Role, "all">, Screen[]]>);

  const visibleScenarios =
    role === "all" ? SCENARIOS : SCENARIOS.filter((s) => s.role === role);

  return (
    <main className="hero-sheen min-h-screen">
      <div className="grid-bg min-h-screen bg-black/10">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <header className="mb-8 flex items-center justify-between">
            <Logo href="/" />
            <Link
              href="/"
              className="text-xs text-slate-400 transition hover:text-slate-200"
            >
              ← Home
            </Link>
          </header>

          <div className="mb-8">
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Dev preview · not available in production
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">
              Launchbelt UI Preview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Walk the full lifecycle, jump into a representative scenario, or
              browse every screen by role. Unauthenticated views fall back to
              clearly labeled preview data.
            </p>
          </div>

          <RoleSwitcher current={role} onChange={setRole} />

          <Section
            title="Walkthroughs"
            subtitle="Sequenced flows showing how a piece of work moves through the platform."
          >
            <div className="space-y-6">
              {WALKTHROUGHS.map((w) => (
                <article
                  key={w.title}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-5"
                >
                  <h3 className="text-base font-semibold text-slate-100">
                    {w.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs text-slate-500">
                    {w.intro}
                  </p>
                  <ol className="mt-4 space-y-2">
                    {w.steps
                      .filter((s) => role === "all" || s.role === role)
                      .map((step, i) => (
                        <li key={`${w.title}-${i}`}>
                          <Link
                            href={step.href}
                            className="group flex items-start gap-3 rounded-md border border-slate-800/60 bg-slate-950/40 p-3 transition hover:border-cyan-500/30 hover:bg-slate-900/70"
                          >
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-[11px] font-semibold text-slate-400">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-2">
                                <span className="text-sm font-medium text-slate-100 transition group-hover:text-cyan-300">
                                  {step.title}
                                </span>
                                <RolePill role={step.role} />
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {step.detail}
                              </span>
                              <code className="mt-1 block text-[10px] text-slate-600">
                                {step.href}
                              </code>
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ol>
                </article>
              ))}
            </div>
          </Section>

          <Section
            title="Scenarios"
            subtitle="Jump straight into a representative state. Useful for demos and QA."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {visibleScenarios.map((s) => (
                <Link
                  key={s.href + s.title}
                  href={s.href}
                  className="group block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-500/30 hover:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-slate-100 transition group-hover:text-cyan-300">
                      {s.title}
                    </div>
                    <RolePill role={s.role} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{s.body}</p>
                  <code className="mt-2 block text-[10px] text-slate-600">
                    {s.href}
                  </code>
                </Link>
              ))}
            </div>
          </Section>

          <Section
            title="All screens"
            subtitle={
              role === "all"
                ? `Every page grouped by role (${Object.values(SCREENS).reduce((a, s) => a + s.length, 0)} total).`
                : `${SCREENS[role as Exclude<Role, "all">].length} ${role} screens.`
            }
          >
            <div className="space-y-8">
              {screens.map(([groupRole, groupScreens]) => (
                <section key={groupRole}>
                  <div className="mb-3 flex items-baseline justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-400">
                      {groupRole} — {groupScreens.length} screens
                    </h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {groupScreens.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        className="group block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-500/30 hover:bg-slate-900/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-medium text-slate-100 transition group-hover:text-cyan-300">
                            {s.title}
                          </div>
                          <StatusPill status={s.status} />
                        </div>
                        <code className="mt-1 block text-[11px] text-slate-500">
                          {s.href}
                        </code>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          {s.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Section>

          <footer className="mt-16 border-t border-slate-800 pt-6 text-[11px] text-slate-500">
            Launchbelt — Aerospace manufacturing orchestration · build preview
            only · routed through role layouts
          </footer>
        </div>
      </div>
    </main>
  );
}

function RoleSwitcher({
  current,
  onChange,
}: {
  current: Role;
  onChange: (r: Role) => void;
}) {
  const tabs: Array<{ key: Role; label: string }> = [
    { key: "all", label: "All roles" },
    { key: "admin", label: "Admin" },
    { key: "supplier", label: "Supplier" },
    { key: "buyer", label: "Buyer" },
  ];
  return (
    <div className="mb-8 inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            current === t.key
              ? "bg-slate-800 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function RolePill({ role }: { role: "admin" | "supplier" | "buyer" }) {
  return (
    <span
      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${ROLE_STYLES[role]}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

function StatusPill({ status }: { status: ScreenStatus }) {
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
