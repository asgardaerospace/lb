import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import {
  listProgramsForOrg,
  listRfqsForOrg,
} from "@/lib/rfq/repository";
import { listJobsForBuyer } from "@/lib/jobs/repository";
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
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const [programs, rfqs, jobs] = await Promise.all([
    listProgramsForOrg(user.organization_id),
    listRfqsForOrg(user.organization_id),
    listJobsForBuyer(user.organization_id),
  ]);

  const inProduction = jobs.filter((j) => j.status === "in_production").length;
  const pendingQuotes = rfqs.filter((r) =>
    ["submitted", "routing_in_progress", "quotes_requested"].includes(r.status),
  ).length;

  type RfqRow = (typeof rfqs)[number];
  const rfqColumns: Column<RfqRow>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) => (
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
        const { label, tone } = mapStatus(rfqStatusMap, r.status as string);
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
      render: (r) => <span className="tabular-nums text-slate-400">{r.quantity ?? "—"}</span>,
    },
    {
      key: "need",
      header: "Need-by",
      render: (r) => <span className="text-slate-400">{formatDate(r.required_delivery_date)}</span>,
    },
  ];

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

      <KpiGrid>
        <KpiCard label="Active Programs" value={programs.length} accent="cyan" />
        <KpiCard label="Total RFQs" value={rfqs.length} accent="emerald" />
        <KpiCard
          label="Pending Quotes"
          value={pendingQuotes}
          sublabel="Awaiting supplier response"
          accent="amber"
        />
        <KpiCard
          label="In Production"
          value={inProduction}
          sublabel={`${jobs.length} total jobs`}
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
      {programs.length === 0 ? (
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
          {programs.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                {p.program_type ?? "Program"}
              </div>
              <Link
                href={`/buyer/programs/${p.id}`}
                className="text-base font-semibold text-slate-100 transition hover:text-cyan-300"
              >
                {p.program_name}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                {p.description ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusBadge tone={p.status === "active" ? "success" : "neutral"}>
                  {p.status}
                </StatusBadge>
                {p.itar_controlled && <StatusBadge tone="warn">ITAR</StatusBadge>}
                {p.cui_controlled && <StatusBadge tone="warn">CUI</StatusBadge>}
              </div>
              <div className="mt-auto pt-4">
                <Link
                  href={`/buyer/programs/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300"
                >
                  Open program →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionHeader
        title="Recent RFQs"
        subtitle="All RFQs across your programs"
      />
      <DataTable
        columns={rfqColumns}
        rows={rfqs}
        rowKey={(r) => r.id}
        emptyTitle="No RFQs yet"
        emptyBody="Create an RFQ inside a program to begin routing work to qualified suppliers."
      />
    </>
  );
}
