import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listJobsForSupplier } from "@/lib/jobs/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  LinkButton,
  StatusBadge,
  mapStatus,
  jobStatusMap,
  ProgressBar,
  KpiCard,
  KpiGrid,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate, jobStatusToProgress } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

interface JobRow {
  id: string;
  job_number: string | null;
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
    status: "in_production",
    start_date: "2026-04-01",
    due_date: "2026-06-15",
    completed_date: null,
    last_issue_flagged_at: null,
  },
  {
    id: "job-prev-2",
    job_number: "JOB-0091",
    status: "scheduled",
    start_date: "2026-05-01",
    due_date: "2026-07-02",
    completed_date: null,
    last_issue_flagged_at: null,
  },
  {
    id: "job-prev-3",
    job_number: "JOB-0092",
    status: "inspection",
    start_date: "2026-03-15",
    due_date: "2026-05-20",
    completed_date: null,
    last_issue_flagged_at: "2026-04-18T10:00:00Z",
  },
];

async function loadJobs(orgId: string): Promise<JobRow[] | null> {
  try {
    const data = await listJobsForSupplier(orgId);
    return data as unknown as JobRow[];
  } catch {
    return null;
  }
}

export default async function SupplierJobsPage() {
  const user = await getOptionalUser();
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";
  const live = isSupplier && user ? await loadJobs(user.organization_id) : null;
  const previewMode = !isSupplier || live === null;
  const jobs = previewMode ? PREVIEW_JOBS : live!;

  const inProd = jobs.filter((j) => j.status === "in_production").length;
  const insp = jobs.filter((j) => j.status === "inspection").length;
  const complete = jobs.filter((j) => j.status === "complete").length;

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
        eyebrow="Supplier · Execution"
        title="Jobs"
        subtitle="Production commitments owned by your organization — open a job to update status or flag issues."
      />

      {previewMode && (
        <PreviewDataBanner reason="No supplier session — showing illustrative jobs." />
      )}

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
        emptyBody="Accepted quotes become jobs. Submit a competitive quote on an open request to get on the production schedule."
        emptyAction={
          <LinkButton href="/supplier/quote-requests" variant="primary" size="sm">
            View open quote requests →
          </LinkButton>
        }
        previewBanner={previewMode}
      />
    </>
  );
}
