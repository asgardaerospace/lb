import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
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
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate, jobStatusToProgress } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

interface JobRow {
  id: string;
  job_number: string | null;
  supplier_organization_id: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  last_issue_flagged_at: string | null;
}

const PREVIEW_JOBS: JobRow[] = [
  {
    id: "job-prev-1",
    job_number: "JOB-0087",
    supplier_organization_id: "org-prev-1",
    status: "in_production",
    start_date: "2026-04-01",
    due_date: "2026-06-15",
    completed_date: null,
    last_issue_flagged_at: null,
  },
  {
    id: "job-prev-2",
    job_number: "JOB-0091",
    supplier_organization_id: "org-prev-2",
    status: "scheduled",
    start_date: "2026-05-01",
    due_date: "2026-07-02",
    completed_date: null,
    last_issue_flagged_at: null,
  },
  {
    id: "job-prev-3",
    job_number: "JOB-0092",
    supplier_organization_id: "org-prev-1",
    status: "inspection",
    start_date: "2026-03-15",
    due_date: "2026-05-20",
    completed_date: null,
    last_issue_flagged_at: "2026-04-18T10:00:00Z",
  },
];

async function loadJobs(): Promise<JobRow[] | null> {
  try {
    const data = await listAllJobs();
    return data as unknown as JobRow[];
  } catch {
    return null;
  }
}

export default async function AdminJobsPage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await loadJobs() : null;
  const previewMode = !isAdmin || live === null;
  const jobs = previewMode ? PREVIEW_JOBS : live!;

  const byStatus = (s: string) => jobs.filter((j) => j.status === s).length;

  const columns: Column<JobRow>[] = [
    {
      key: "job",
      header: "Job",
      render: (j) =>
        previewMode ? (
          <span className="font-mono text-xs text-slate-400">
            {j.job_number ?? j.id.slice(0, 8)}
          </span>
        ) : (
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
      render: (j) => (
        <span className="text-slate-400">{formatDate(j.start_date)}</span>
      ),
    },
    {
      key: "due",
      header: "Due",
      render: (j) => (
        <span className="text-slate-400">{formatDate(j.due_date)}</span>
      ),
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

      {previewMode && (
        <PreviewDataBanner reason="No asgard_admin session — showing illustrative job rows." />
      )}

      <KpiGrid>
        <KpiCard label="Total jobs" value={jobs.length} accent="cyan" />
        <KpiCard
          label="In production"
          value={byStatus("in_production")}
          accent="amber"
        />
        <KpiCard label="Inspection" value={byStatus("inspection")} accent="cyan" />
        <KpiCard label="Complete" value={byStatus("complete")} accent="emerald" />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={jobs}
        rowKey={(j) => j.id}
        emptyTitle="No jobs yet"
        emptyBody="Jobs are created when a supplier quote is accepted in the Quote Pipeline."
        previewBanner={previewMode}
      />
    </>
  );
}
