import { notFound, redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs/repository";
import AdminJobActions from "./AdminJobActions";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Card,
  StatusBadge,
  mapStatus,
  jobStatusMap,
  ProgressBar,
} from "@/components/ui";
import { formatDate, formatDateTime, jobStatusToProgress } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const { label, tone } = mapStatus(jobStatusMap, job.status);

  return (
    <>
      <PageHeader
        eyebrow="Admin · Job Detail"
        title={job.job_number ?? job.id.slice(0, 8)}
        subtitle={`Supplier organization ${job.supplier_organization_id.slice(0, 8)}`}
        actions={<StatusBadge tone={tone}>{label}</StatusBadge>}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Start date
          </div>
          <div className="mt-1 text-sm text-slate-200">
            {formatDate(job.start_date)}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Due date
          </div>
          <div className="mt-1 text-sm text-slate-200">
            {formatDate(job.due_date)}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Completed
          </div>
          <div className="mt-1 text-sm text-slate-200">
            {formatDate(job.completed_date)}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Progress
          </div>
          <div className="mt-2">
            <ProgressBar value={jobStatusToProgress(job.status)} />
          </div>
        </Card>
      </div>

      {job.last_issue_flagged_at && (
        <Card className="mb-5 border-amber-500/25 bg-amber-500/5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400">
            Last issue — {formatDateTime(job.last_issue_flagged_at)}
          </div>
          <p className="mt-1 text-sm text-amber-100">
            {job.last_issue_note ?? "No note recorded."}
          </p>
        </Card>
      )}

      <Card>
        <AdminJobActions jobId={job.id} status={job.status} />
      </Card>
    </>
  );
}
