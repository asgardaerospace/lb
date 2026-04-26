import { getOptionalUser } from "@/lib/auth";
import { listJobsForBuyer } from "@/lib/jobs/repository";
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
    status: "shipped",
    start_date: "2026-03-01",
    due_date: "2026-05-10",
    completed_date: null,
    last_issue_flagged_at: null,
  },
  {
    id: "job-prev-3",
    job_number: "JOB-0072",
    status: "complete",
    start_date: "2026-01-15",
    due_date: "2026-03-30",
    completed_date: "2026-03-28",
    last_issue_flagged_at: null,
  },
];

async function loadJobs(orgId: string): Promise<JobRow[] | null> {
  try {
    const data = await listJobsForBuyer(orgId);
    return data as unknown as JobRow[];
  } catch {
    return null;
  }
}

export default async function BuyerJobsPage() {
  const user = await getOptionalUser();
  const isBuyer = user?.role === "buyer_admin" || user?.role === "buyer_user";
  const live = isBuyer && user ? await loadJobs(user.organization_id) : null;
  const previewMode = !isBuyer || live === null;
  const jobs = previewMode ? PREVIEW_JOBS : live!;

  const inProduction = jobs.filter((j) => j.status === "in_production").length;
  const shipped = jobs.filter((j) => j.status === "shipped").length;
  const complete = jobs.filter((j) => j.status === "complete").length;
  const flagged = jobs.filter((j) => !!j.last_issue_flagged_at).length;

  const columns: Column<JobRow>[] = [
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
        eyebrow="Buyer · Production"
        title="Production Tracking"
        subtitle="Live visibility into jobs running against your RFQs — read-only view."
      />

      {previewMode && (
        <PreviewDataBanner reason="No buyer session — showing illustrative production data." />
      )}

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
        emptyBody="Once suppliers accept quotes against your RFQs, their jobs will appear here with live progress. Start by submitting an RFQ inside one of your programs."
        emptyAction={
          <LinkButton href="/buyer/programs" variant="primary" size="sm">
            View programs →
          </LinkButton>
        }
        previewBanner={previewMode}
      />
    </>
  );
}
