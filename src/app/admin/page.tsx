import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  KpiCard,
  KpiGrid,
  DataTable,
  StatusBadge,
  mapStatus,
  quoteStatusMap,
  jobStatusMap,
  routingStatusMap,
  PreviewDataBanner,
  ProgressBar,
  LinkButton,
  type Column,
} from "@/components/ui";
import { formatCurrency, jobStatusToProgress } from "@/lib/ui/format";
import {
  PREVIEW_ATTENTION_ROWS,
  PREVIEW_PIPELINE_ROWS,
} from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

async function loadKpis() {
  const supabase = await createServerSupabase();

  const [programs, rfqs, quotes, jobs] = await Promise.all([
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("rfqs").select("id,status", { count: "exact" }),
    supabase
      .from("quotes")
      .select("quoted_price,status,submitted_at", { count: "exact" }),
    supabase.from("jobs").select("id,status", { count: "exact" }),
  ]);

  const routedValue = (quotes.data ?? [])
    .filter((q) => q.status === "accepted")
    .reduce((acc, q) => acc + (Number(q.quoted_price) || 0), 0);

  const inProduction = (jobs.data ?? []).filter(
    (j) => j.status === "in_production",
  ).length;

  return {
    programCount: programs.count ?? 0,
    rfqCount: rfqs.count ?? 0,
    quoteCount: quotes.count ?? 0,
    jobCount: jobs.count ?? 0,
    routedValue,
    inProduction,
  };
}

async function loadPipelineRows() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("jobs")
    .select(
      "id,status,job_number,work_packages(package_name,rfqs(rfq_title,programs(program_name)))",
    )
    .order("updated_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export default async function AdminOverviewPage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const [kpis, pipeline] = await Promise.all([
    loadKpis(),
    loadPipelineRows(),
  ]);

  const usePreview = pipeline.length === 0;

  const liveColumns: Column<(typeof PREVIEW_PIPELINE_ROWS)[number]>[] = [
    { key: "part", header: "Part", render: (r) => <span className="text-slate-200">{r.part}</span> },
    { key: "program", header: "Program", render: (r) => <span className="text-slate-400">{r.program}</span> },
    { key: "module", header: "Work Package", render: (r) => <span className="text-slate-400">{r.module}</span> },
    {
      key: "supplier",
      header: "Supplier",
      render: (r) => <span className="text-slate-400">{r.supplier}</span>,
    },
    {
      key: "status",
      header: "Job Status",
      render: (r) => {
        const { label, tone } = mapStatus(jobStatusMap, r.partStatus);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "routing",
      header: "Routing",
      render: (r) => {
        const { label, tone } = mapStatus(routingStatusMap, r.routing);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "quote",
      header: "Quote",
      render: (r) => {
        const { label, tone } = mapStatus(quoteStatusMap, r.quote);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
  ];

  const attentionColumns: Column<(typeof PREVIEW_ATTENTION_ROWS)[number]>[] = [
    { key: "part", header: "Part", render: (r) => <span className="text-slate-200">{r.part}</span> },
    { key: "program", header: "Program", render: (r) => <span className="text-slate-400">{r.program}</span> },
    {
      key: "readiness",
      header: "Readiness",
      render: (r) => (
        <div className="flex items-center gap-3">
          <ProgressBar value={r.readiness} tone="emerald" />
        </div>
      ),
    },
    { key: "level", header: "Level", render: (r) => <span className="text-slate-400">{r.level}</span> },
    {
      key: "routing",
      header: "Routing",
      render: (r) => {
        const { label, tone } = mapStatus(routingStatusMap, r.routing);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "issue",
      header: "Next Action",
      render: (r) => <span className="text-xs text-amber-200/80">{r.issue}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Asgard Aerospace · Internal Command Center"
        title="Operations Control Center"
        subtitle="System-wide visibility across programs, routing decisions, supplier quotes, and active production."
        actions={
          <>
            <LinkButton href="/admin/routing" variant="secondary" size="sm">
              Open Routing Queue
            </LinkButton>
            <LinkButton href="/admin/suppliers" variant="primary" size="sm">
              Review Suppliers
            </LinkButton>
          </>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Total Routed Value"
          value={formatCurrency(kpis.routedValue)}
          sublabel="Sum of accepted quote prices"
          accent="cyan"
        />
        <KpiCard
          label="Active Programs"
          value={kpis.programCount}
          sublabel="All buyer programs"
          accent="emerald"
        />
        <KpiCard
          label="RFQs in Flight"
          value={kpis.rfqCount}
          sublabel="Submitted or routing"
          accent="amber"
        />
        <KpiCard
          label="Jobs in Production"
          value={kpis.inProduction}
          sublabel={`${kpis.jobCount} total jobs`}
          accent="cyan"
        />
      </KpiGrid>

      {usePreview && (
        <PreviewDataBanner reason="Live pipeline is empty — showing illustrative rows so operators can preview layout." />
      )}

      <SectionHeader
        title="Live Work Pipeline"
        subtitle="Parts actively routing, quoting, or in production"
        actions={
          <LinkButton href="/admin/jobs" variant="ghost" size="sm">
            View all jobs →
          </LinkButton>
        }
      />
      <div className="mb-8">
        {usePreview ? (
          <DataTable
            columns={liveColumns}
            rows={PREVIEW_PIPELINE_ROWS as unknown as (typeof PREVIEW_PIPELINE_ROWS)[number][]}
            rowKey={(r, i) => `${r.part}-${i}`}
            previewBanner
          />
        ) : (
          <DataTable
            columns={[
              {
                key: "job",
                header: "Job",
                render: (
                  j: (typeof pipeline)[number] & { job_number: string },
                ) => <span className="font-mono text-xs text-slate-300">{j.job_number}</span>,
              },
              {
                key: "rfq",
                header: "RFQ",
                render: (j: (typeof pipeline)[number]) => {
                  const wp = j.work_packages as {
                    package_name?: string;
                    rfqs?: { rfq_title?: string };
                  } | null;
                  return (
                    <span className="text-slate-300">
                      {wp?.rfqs?.rfq_title ?? wp?.package_name ?? "—"}
                    </span>
                  );
                },
              },
              {
                key: "program",
                header: "Program",
                render: (j: (typeof pipeline)[number]) => {
                  const program =
                    (
                      j.work_packages as {
                        rfqs?: { programs?: { program_name?: string } };
                      } | null
                    )?.rfqs?.programs?.program_name ?? "—";
                  return <span className="text-slate-400">{program}</span>;
                },
              },
              {
                key: "status",
                header: "Status",
                render: (j: (typeof pipeline)[number]) => {
                  const { label, tone } = mapStatus(jobStatusMap, j.status as string);
                  return <StatusBadge tone={tone}>{label}</StatusBadge>;
                },
              },
              {
                key: "progress",
                header: "Progress",
                render: (j: (typeof pipeline)[number]) => (
                  <ProgressBar value={jobStatusToProgress(j.status as string)} />
                ),
              },
            ]}
            rows={pipeline}
            rowKey={(r: { id: string }) => r.id}
          />
        )}
      </div>

      <SectionHeader
        title="Attention Needed"
        subtitle="Parts blocked on routing, missing data, or waiting longer than expected"
      />
      <DataTable
        columns={attentionColumns}
        rows={PREVIEW_ATTENTION_ROWS as unknown as (typeof PREVIEW_ATTENTION_ROWS)[number][]}
        rowKey={(r, i) => `${r.part}-${i}`}
        previewBanner
      />
    </>
  );
}
