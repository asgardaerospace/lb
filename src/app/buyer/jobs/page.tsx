import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listJobsForBuyer } from "@/lib/jobs/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  jobStatusMap,
  ProgressBar,
  KpiCard,
  KpiGrid,
  type Column,
} from "@/components/ui";
import { formatDate, jobStatusToProgress } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function BuyerJobsPage() {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const jobs = await listJobsForBuyer(user.organization_id);

  const inProduction = jobs.filter((j) => j.status === "in_production").length;
  const shipped = jobs.filter((j) => j.status === "shipped").length;
  const complete = jobs.filter((j) => j.status === "complete").length;
  const flagged = jobs.filter((j) => !!j.last_issue_flagged_at).length;

  type Row = (typeof jobs)[number];
  const columns: Column<Row>[] = [
    {
      key: "job",
      header: "Job",
      render: (j) => (
        <span className="font-mono text-xs text-slate-200">
          {j.job_number ?? j.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (j) => {
        const { label, tone } = mapStatus(jobStatusMap, j.status);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "progress",
      header: "Progress",
      render: (j) => <ProgressBar value={jobStatusToProgress(j.status)} />,
    },
    {
      key: "start",
      header: "Start",
      render: (j) => <span className="text-slate-400">{formatDate(j.start_date)}</span>,
    },
    {
      key: "due",
      header: "Due",
      render: (j) => <span className="text-slate-400">{formatDate(j.due_date)}</span>,
    },
    {
      key: "completed",
      header: "Completed",
      render: (j) => (
        <span className="text-slate-400">{formatDate(j.completed_date)}</span>
      ),
    },
    {
      key: "issue",
      header: "Issue",
      align: "center",
      render: (j) =>
        j.last_issue_flagged_at ? (
          <StatusBadge tone="warn" dot={false}>
            ⚠
          </StatusBadge>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Buyer · Production"
        title="Production Tracking"
        subtitle="Live visibility into jobs running against your RFQs — read-only view."
      />

      <KpiGrid>
        <KpiCard label="Total jobs" value={jobs.length} accent="cyan" />
        <KpiCard label="In production" value={inProduction} accent="amber" />
        <KpiCard label="Shipped" value={shipped} accent="cyan" />
        <KpiCard label="Complete" value={complete} accent="emerald" />
      </KpiGrid>

      {flagged > 0 && (
        <div className="mb-4 rounded-md border border-amber-500/25 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200">
          {flagged} job{flagged === 1 ? " has" : "s have"} an open issue flagged by the supplier.
        </div>
      )}

      <DataTable
        columns={columns}
        rows={jobs}
        rowKey={(j) => j.id}
        emptyTitle="No jobs yet"
        emptyBody="Once suppliers accept quotes against your RFQs, their jobs will appear here with live progress."
      />
    </>
  );
}
