import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import {
  listProgramsForOrg,
  listRfqsForOrg,
} from "@/lib/rfq/repository";
import { listJobsForBuyer } from "@/lib/jobs/repository";
import { loadBuyerKpis } from "@/lib/kpis";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  LinkButton,
  EmptyState,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/ui/format";
import { PREVIEW_BUYER_PROGRAMS, PREVIEW_BUYER_RFQS } from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

type Program = {
  id: string;
  program_name: string;
  program_type: string | null;
  description: string | null;
  status: string;
  itar_controlled: boolean;
  cui_controlled: boolean;
  compliance_level?: string | null;
};

type Rfq = {
  id: string;
  rfq_title: string;
  status: string;
  priority: string;
  quantity: number | null;
  required_delivery_date: string | null;
};

const RFQ_COLUMNS_BASE: Column<Rfq>[] = [
  {
    key: "title",
    header: "RFQ",
    render: (r) =>
      r.id.startsWith("rfq-prev-") ? (
        <span className="font-medium text-slate-100">{r.rfq_title}</span>
      ) : (
        <Link
          href={`/buyer/rfqs/${r.id}`}
          className="font-medium text-slate-100 transition hover:text-cyan-300"
        >
          {r.rfq_title}
        </Link>
      ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => {
      const { label, tone } = mapStatus(rfqStatusMap, r.status);
      return <StatusBadge tone={tone}>{label}</StatusBadge>;
    },
  },
  {
    key: "priority",
    header: "Priority",
    render: (r) => <StatusBadge tone="info">{r.priority}</StatusBadge>,
  },
  {
    key: "qty",
    header: "Qty",
    align: "right",
    render: (r) => (
      <span className="tabular-nums text-slate-400">{r.quantity ?? "—"}</span>
    ),
  },
  {
    key: "need",
    header: "Need-by",
    render: (r) => (
      <span className="text-slate-400">
        {formatDate(r.required_delivery_date)}
      </span>
    ),
  },
];

export default async function BuyerDashboardPage() {
  const user = await getOptionalUser();
  const isBuyer = user?.role === "buyer_admin" || user?.role === "buyer_user";

  let programs: Program[] = [];
  let rfqs: Rfq[] = [];
  let jobs: Awaited<ReturnType<typeof listJobsForBuyer>> = [];
  let kpis: Awaited<ReturnType<typeof loadBuyerKpis>> = null;
  let liveLoadFailed = false;

  if (isBuyer && user) {
    try {
      const [p, r, j, k] = await Promise.all([
        listProgramsForOrg(user.organization_id),
        listRfqsForOrg(user.organization_id),
        listJobsForBuyer(user.organization_id),
        loadBuyerKpis(user.organization_id),
      ]);
      programs = p as Program[];
      rfqs = r as Rfq[];
      jobs = j;
      kpis = k;
    } catch {
      liveLoadFailed = true;
    }
  }

  const previewMode = !isBuyer || liveLoadFailed;
  const displayPrograms: Program[] = previewMode
    ? (PREVIEW_BUYER_PROGRAMS as unknown as Program[])
    : programs;
  const displayRfqs: Rfq[] = previewMode
    ? (PREVIEW_BUYER_RFQS as unknown as Rfq[])
    : rfqs;

  const previewRfqsInRouting = (PREVIEW_BUYER_RFQS as unknown as Rfq[]).filter(
    (r) =>
      r.status === "routing_in_progress" || r.status === "quotes_requested",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Buyer · Mission Control"
        title="Mission Control"
        subtitle="Track your programs, RFQs, and production status across the Launchbelt supplier network."
        actions={
          <LinkButton href="/buyer/programs/new" variant="primary" size="sm">
            + Submit Program
          </LinkButton>
        }
      />

      {previewMode && (
        <PreviewDataBanner
          reason={
            !user
              ? "No buyer session detected. Showing illustrative programs, RFQs, and production data for layout review."
              : liveLoadFailed
                ? "Could not reach Supabase to load buyer data. Showing illustrative preview content."
                : "Signed in account does not belong to a buyer organization. Showing illustrative preview content."
          }
        />
      )}

      <KpiGrid>
        <KpiCard
          label="Programs Active"
          value={
            previewMode
              ? displayPrograms.length
              : (kpis?.programsActive ?? displayPrograms.length)
          }
          sublabel={
            previewMode
              ? "Preview"
              : `${kpis?.programsTotal ?? displayPrograms.length} total`
          }
          accent="cyan"
        />
        <KpiCard
          label="RFQs Submitted"
          value={
            previewMode
              ? displayRfqs.filter((r) => r.status !== "draft").length
              : (kpis?.rfqsSubmitted ?? 0)
          }
          sublabel={`${previewMode ? displayRfqs.length : (kpis?.rfqsTotal ?? 0)} on file`}
          accent="emerald"
        />
        <KpiCard
          label="In Routing"
          value={previewMode ? previewRfqsInRouting : (kpis?.rfqsInRouting ?? 0)}
          sublabel="Awaiting supplier response"
          accent="amber"
        />
        <KpiCard
          label="Jobs in Production"
          value={previewMode ? 2 : (kpis?.jobsInProduction ?? 0)}
          sublabel={
            previewMode
              ? "Preview · 7 jobs"
              : `${kpis?.jobsComplete ?? 0} complete · ${kpis?.jobsTotal ?? jobs.length} total`
          }
          accent="cyan"
        />
      </KpiGrid>

      <SectionHeader
        title="Your Programs"
        subtitle="Active programs owned by your organization"
        actions={
          <LinkButton href="/buyer/programs" variant="ghost" size="sm">
            View all programs →
          </LinkButton>
        }
      />
      {displayPrograms.length === 0 ? (
        <EmptyState
          title="No programs yet"
          body="Create your first program to start routing work into the supplier network."
          action={
            <LinkButton href="/buyer/programs/new" variant="primary" size="sm">
              + Submit Program
            </LinkButton>
          }
        />
      ) : (
        <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayPrograms.map((p) => {
            const isPreview = p.id.startsWith("prog-prev-");
            const Title = (
              <span className="text-base font-semibold text-slate-100 transition group-hover:text-cyan-300">
                {p.program_name}
              </span>
            );
            return (
              <Card key={p.id} className="group flex flex-col">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  {p.program_type ?? "Program"}
                </div>
                {isPreview ? (
                  Title
                ) : (
                  <Link href={`/buyer/programs/${p.id}`}>{Title}</Link>
                )}
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {p.description ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StatusBadge
                    tone={p.status === "active" ? "success" : "neutral"}
                  >
                    {p.status}
                  </StatusBadge>
                  {p.itar_controlled && (
                    <StatusBadge tone="warn">ITAR</StatusBadge>
                  )}
                  {p.cui_controlled && (
                    <StatusBadge tone="warn">CUI</StatusBadge>
                  )}
                </div>
                <div className="mt-auto pt-4">
                  {isPreview ? (
                    <span className="text-[10px] uppercase tracking-[0.22em] text-amber-300">
                      Preview only
                    </span>
                  ) : (
                    <Link
                      href={`/buyer/programs/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300"
                    >
                      Open program →
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SectionHeader
        title="Recent RFQs"
        subtitle="All RFQs across your programs"
      />
      <DataTable
        columns={RFQ_COLUMNS_BASE}
        rows={displayRfqs}
        rowKey={(r) => r.id}
        emptyTitle="No RFQs yet"
        emptyBody="Create an RFQ inside a program to begin routing work to qualified suppliers."
        previewBanner={previewMode}
      />
    </>
  );
}
