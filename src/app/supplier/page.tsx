import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listQuoteRequestsForSupplier } from "@/lib/routing/repository";
import { listSupplierInbox } from "@/lib/quotes/repository";
import { listJobsForSupplier } from "@/lib/jobs/repository";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  KpiCard,
  KpiGrid,
  Card,
  StatusBadge,
  mapStatus,
  jobStatusMap,
  ProgressBar,
  LinkButton,
  EmptyState,
  PreviewDataBanner,
} from "@/components/ui";
import { formatDate, jobStatusToProgress } from "@/lib/ui/format";
import {
  PREVIEW_SUPPLIER_JOBS,
  PREVIEW_SUPPLIER_WORK_PACKAGES,
} from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

export default async function SupplierDashboardPage() {
  const user = await getOptionalUser();
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";

  let requests: Awaited<ReturnType<typeof listQuoteRequestsForSupplier>> = [];
  let inbox: Awaited<ReturnType<typeof listSupplierInbox>> = [];
  let jobs: Awaited<ReturnType<typeof listJobsForSupplier>> = [];
  let liveLoadFailed = false;

  if (isSupplier && user) {
    try {
      [requests, inbox, jobs] = await Promise.all([
        listQuoteRequestsForSupplier(user.organization_id),
        listSupplierInbox(user.organization_id),
        listJobsForSupplier(user.organization_id),
      ]);
    } catch {
      liveLoadFailed = true;
    }
  }

  const previewMode = !isSupplier || liveLoadFailed;

  if (previewMode) {
    return (
      <SupplierDashboardPreview previewReason={previewReasonFor(user, liveLoadFailed)} />
    );
  }

  const pendingQuotes = inbox.filter(
    (e) => !e.existing_quote || e.existing_quote.status === "draft",
  ).length;
  const inProduction = jobs.filter((j) => j.status === "in_production").length;
  const complete = jobs.filter((j) => j.status === "complete").length;

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Manufacturing Partner"
        title="Partner Dashboard"
        subtitle="Review assigned work packages, submit quotes, and post production updates."
        actions={
          <>
            <LinkButton href="/supplier/profile" variant="secondary" size="sm">
              Company Profile
            </LinkButton>
            <LinkButton
              href="/supplier/quote-requests"
              variant="primary"
              size="sm"
            >
              Open Quote Requests
            </LinkButton>
          </>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Parts Assigned"
          value={requests.reduce((acc, r) => acc + r.parts.length, 0)}
          sublabel={`${requests.length} work packages`}
          accent="cyan"
        />
        <KpiCard
          label="Quotes Pending"
          value={pendingQuotes}
          sublabel="Awaiting your response"
          accent="amber"
        />
        <KpiCard
          label="In Production"
          value={inProduction}
          sublabel={`${jobs.length} total jobs`}
          accent="emerald"
        />
        <KpiCard
          label="Completed"
          value={complete}
          sublabel="This partnership to date"
          accent="slate"
        />
      </KpiGrid>

      <SectionHeader
        title="Assigned Work Packages"
        subtitle="Packages you've been invited to quote"
        actions={
          <LinkButton href="/supplier/quote-requests" variant="ghost" size="sm">
            View all →
          </LinkButton>
        }
      />
      {requests.length === 0 ? (
        <EmptyState
          title="No assigned work packages"
          body="When an Asgard operator routes a work package to your organization it will appear here."
        />
      ) : (
        <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {requests.slice(0, 6).map((r) => (
            <Card key={r.routing_decision_id} className="flex flex-col">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                Priority {r.rfq_priority}
              </div>
              <div className="text-sm font-medium text-slate-100">
                {r.rfq_title}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {r.parts.length} part{r.parts.length === 1 ? "" : "s"}
                {r.rfq_required_delivery_date
                  ? ` · need-by ${formatDate(r.rfq_required_delivery_date)}`
                  : ""}
              </div>
              {r.rfq_description && (
                <p className="mt-3 line-clamp-2 text-xs text-slate-400">
                  {r.rfq_description}
                </p>
              )}
              <div className="mt-4">
                <Link
                  href={`/supplier/quotes/${r.routing_decision_id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                >
                  Open work package →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionHeader
        title="Active Jobs"
        subtitle="Production commitments currently under your ownership"
        actions={
          <LinkButton href="/supplier/jobs" variant="ghost" size="sm">
            All jobs →
          </LinkButton>
        }
      />
      {jobs.length === 0 ? (
        <EmptyState
          title="No active jobs"
          body="Accepted quotes become jobs here. Your dashboard will update automatically."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {jobs.slice(0, 6).map((j) => {
            const { label, tone } = mapStatus(jobStatusMap, j.status);
            return (
              <Card key={j.id}>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/supplier/jobs/${j.id}`}
                    className="font-mono text-xs text-cyan-300 transition hover:text-cyan-200"
                  >
                    {j.job_number ?? j.id.slice(0, 8)}
                  </Link>
                  <StatusBadge tone={tone}>{label}</StatusBadge>
                </div>
                <div className="mt-3">
                  <ProgressBar value={jobStatusToProgress(j.status)} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Due {formatDate(j.due_date)}</span>
                  {j.last_issue_flagged_at && (
                    <span className="text-amber-300">⚠ Issue flagged</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function previewReasonFor(
  user: Awaited<ReturnType<typeof getOptionalUser>>,
  liveLoadFailed: boolean,
): string {
  if (!user) {
    return "No supplier session detected. Showing illustrative work packages and jobs so the layout can be reviewed without live data.";
  }
  if (liveLoadFailed) {
    return "Could not reach Supabase to load live supplier data. Showing illustrative preview content for layout review.";
  }
  return "Signed in account does not belong to a supplier organization. Showing illustrative preview content.";
}

function SupplierDashboardPreview({ previewReason }: { previewReason: string }) {
  const totalParts = PREVIEW_SUPPLIER_WORK_PACKAGES.reduce(
    (acc, r) => acc + r.parts,
    0,
  );
  const inProduction = PREVIEW_SUPPLIER_JOBS.filter(
    (j) => (j.status as string) === "in_production",
  ).length;
  const complete = PREVIEW_SUPPLIER_JOBS.filter(
    (j) => (j.status as string) === "complete",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Manufacturing Partner"
        title="Partner Dashboard"
        subtitle="Review assigned work packages, submit quotes, and post production updates."
        actions={
          <>
            <LinkButton href="/supplier/profile" variant="secondary" size="sm">
              Company Profile
            </LinkButton>
            <LinkButton
              href="/supplier/quote-requests"
              variant="primary"
              size="sm"
            >
              Open Quote Requests
            </LinkButton>
          </>
        }
      />

      <PreviewDataBanner reason={previewReason} />

      <KpiGrid>
        <KpiCard
          label="Parts Assigned"
          value={totalParts}
          sublabel={`${PREVIEW_SUPPLIER_WORK_PACKAGES.length} work packages`}
          accent="cyan"
        />
        <KpiCard
          label="Quotes Pending"
          value={PREVIEW_SUPPLIER_WORK_PACKAGES.length}
          sublabel="Awaiting your response"
          accent="amber"
        />
        <KpiCard
          label="In Production"
          value={inProduction}
          sublabel={`${PREVIEW_SUPPLIER_JOBS.length} total jobs`}
          accent="emerald"
        />
        <KpiCard
          label="Completed"
          value={complete}
          sublabel="This partnership to date"
          accent="slate"
        />
      </KpiGrid>

      <SectionHeader
        title="Assigned Work Packages"
        subtitle="Packages you've been invited to quote"
      />
      <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PREVIEW_SUPPLIER_WORK_PACKAGES.map((r) => (
          <Card key={r.id} className="flex flex-col">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Priority {r.priority}
            </div>
            <div className="text-sm font-medium text-slate-100">{r.title}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {r.parts} parts · need-by {formatDate(r.need_by)}
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-slate-400">
              {r.description}
            </p>
            <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-amber-300">
              Preview only
            </div>
          </Card>
        ))}
      </div>

      <SectionHeader
        title="Active Jobs"
        subtitle="Production commitments currently under your ownership"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PREVIEW_SUPPLIER_JOBS.map((j) => {
          const { label, tone } = mapStatus(jobStatusMap, j.status);
          return (
            <Card key={j.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-cyan-300">
                  {j.job_number}
                </span>
                <StatusBadge tone={tone}>{label}</StatusBadge>
              </div>
              <div className="mt-3">
                <ProgressBar value={jobStatusToProgress(j.status)} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Due {formatDate(j.due_date)}</span>
                {j.flagged && (
                  <span className="text-amber-300">⚠ Issue flagged</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
