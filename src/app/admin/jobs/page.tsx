import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listAllJobs } from "@/lib/jobs/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  mapStatus,
  jobStatusMap,
  ProgressBar,
  type Column,
} from "@/components/ui";
import { formatDate, jobStatusToProgress } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const jobs = await listAllJobs();

  const byStatus = (s: string) =>
    jobs.filter((j) => j.status === s).length;

  type Row = (typeof jobs)[number];
  const columns: Column<Row>[] = [
    {
      key: "job",
      header: "Job",
      render: (j) => (
        <Link
          href={`/admin/jobs/${j.id}`}
          className="font-mono text-xs text-cyan-300 transition hover:text-cyan-200"
        >
          {j.job_number ?? j.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "supplier",
      header: "Supplier org",
      render: (j) => (
        <span className="font-mono text-xs text-slate-400">
          {j.supplier_organization_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (j) => {
        const { label, tone } = mapStatus(jobStatusMap, j.status as string);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "progress",
      header: "Progress",
      render: (j) => <ProgressBar value={jobStatusToProgress(j.status as string)} />,
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
        eyebrow="Admin · Jobs"
        title="Job Oversight"
        subtitle="All production jobs across suppliers — drill in to status, issues, and delivery."
      />

      <KpiGrid>
        <KpiCard label="Total jobs" value={jobs.length} accent="cyan" />
        <KpiCard label="In production" value={byStatus("in_production")} accent="amber" />
        <KpiCard label="Inspection" value={byStatus("inspection")} accent="cyan" />
        <KpiCard label="Complete" value={byStatus("complete")} accent="emerald" />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={jobs}
        rowKey={(j) => j.id}
        emptyTitle="No jobs yet"
        emptyBody="Jobs are created when a supplier quote is accepted in the Quote Pipeline."
      />
    </>
  );
}
