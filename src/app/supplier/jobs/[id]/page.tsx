import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { getJobById } from "@/lib/jobs/repository";
import SupplierJobActions from "./SupplierJobActions";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Card,
  StatusBadge,
  mapStatus,
  jobStatusMap,
  ProgressBar,
  RequiresLiveData,
} from "@/components/ui";
import { formatDate, formatDateTime, jobStatusToProgress } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function SupplierJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOptionalUser();
  const { id } = await params;
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";

  if (!isSupplier || !user) {
    return (
      <>
        <PageHeader
          eyebrow="Supplier · Job Detail"
          title={id.slice(0, 8)}
          subtitle="Job detail requires an authenticated supplier session."
        />
        <RequiresLiveData
          reason="Per-job detail relies on live Supabase data scoped to your supplier organization."
          backHref="/supplier/jobs"
          backLabel="Back to Jobs preview"
        />
      </>
    );
  }

  let job: Awaited<ReturnType<typeof getJobById>> | null = null;
  try {
    job = await getJobById(id);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Supplier · Job Detail" title={id.slice(0, 8)} />
        <RequiresLiveData
          reason="Could not reach Supabase to load this job."
          backHref="/supplier/jobs"
          backLabel="Back to Jobs"
        />
      </>
    );
  }

  if (!job || job.supplier_organization_id !== user.organization_id) {
    notFound();
  }

  const canAct = user.role === "supplier_admin";
  const { label, tone } = mapStatus(jobStatusMap, job.status);

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Job Detail"
        title={job.job_number ?? job.id.slice(0, 8)}
        subtitle="Update status, flag issues, and track progress against this job."
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
        <SupplierJobActions jobId={job.id} status={job.status} canAct={canAct} />
      </Card>

      <p className="mt-5 text-xs text-slate-500">
        Document upload placeholder — job-level CAD, inspection records, and
        traveler uploads will attach here once the storage layer is wired.
      </p>
    </>
  );
}
