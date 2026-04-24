import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listJobsForSupplier } from "@/lib/jobs/repository";
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

export default async function SupplierJobsPage() {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const jobs = await listJobsForSupplier(user.organization_id);

  const inProd = jobs.filter((j) => j.status === "in_production").length;
  const insp = jobs.filter((j) => j.status === "inspection").length;
  const complete = jobs.filter((j) => j.status === "complete").length;

  type Row = (typeof jobs)[number];
  const columns: Column<Row>[] = [
    {
      key: "job",
      header: "Job",
      render: (j) => (
        <Link
          href={`/supplier/jobs/${j.id}`}
          className="font-mono text-xs text-cyan-300 transition hover:text-cyan-200"
        >
          {j.job_number ?? j.id.slice(0, 8)}
        </Link>
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
        eyebrow="Supplier · Execution"
        title="Jobs"
        subtitle="Production commitments owned by your organization — open a job to update status or flag issues."
      />

      <KpiGrid>
        <KpiCard label="Total jobs" value={jobs.length} accent="cyan" />
        <KpiCard label="In production" value={inProd} accent="amber" />
        <KpiCard label="Inspection" value={insp} accent="cyan" />
        <KpiCard label="Complete" value={complete} accent="emerald" />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={jobs}
        rowKey={(j) => j.id}
        emptyTitle="No assigned jobs"
        emptyBody="Accepted quotes become jobs. Once Asgard accepts one of your quotes, the resulting job will appear here."
      />
    </>
  );
}
