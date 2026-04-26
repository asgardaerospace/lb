import { getOptionalUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { loadAdminKpis, type AdminKpis } from "@/lib/kpis";
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

const PREVIEW_KPIS: AdminKpis = {
  programCount: 15,
  rfqCount: 33,
  rfqsSubmitted: 28,
  quoteCount: 34,
  jobCount: 12,
  jobsActive: 8,
  inProduction: 6,
  routedValue: 36400,
  supplierUtilization: 42,
};

type PipelineRow = {
  id: string;
  status: string;
  job_number: string | null;
  work_packages:
    | {
        package_name?: string;
        rfqs?: {
          rfq_title?: string;
          programs?: { program_name?: string };
        };
      }
    | null;
};

async function loadPipelineRows(): Promise<PipelineRow[] | null> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("jobs")
      .select(
        "id,status,job_number,work_packages(package_name,rfqs(rfq_title,programs(program_name)))",
      )
      .order("updated_at", { ascending: false })
      .limit(10);
    return (data ?? []) as PipelineRow[];
  } catch {
    return null;
  }
}

export default async function AdminOverviewPage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";

  const [kpisLive, pipelineLive] = isAdmin
    ? await Promise.all([loadAdminKpis(), loadPipelineRows()])
    : [null, null];

  const kpis = kpisLive ?? PREVIEW_KPIS;
  const pipeline = pipelineLive ?? [];
  const previewMode = !isAdmin || kpisLive === null;
  const usePreviewPipeline = previewMode || pipeline.length === 0;

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

      {previewMode && (
        <PreviewDataBanner reason="No active asgard_admin session — KPIs and pipeline tables show illustrative preview data only." />
      )}

      <KpiGrid>
        <KpiCard
          label="Total Routed Value"
          value={formatCurrency(kpis.routedValue)}
          sublabel="Sum of accepted quote prices"
          accent="cyan"
        />
        <KpiCard
          label="RFQs Submitted"
          value={kpis.rfqsSubmitted}
          sublabel={`${kpis.rfqCount} total RFQs on file`}
          accent="amber"
        />
        <KpiCard
          label="Jobs Active"
          value={kpis.jobsActive}
          sublabel={`${kpis.inProduction} in production · ${kpis.jobCount} total`}
          accent="cyan"
        />
        <KpiCard
          label="Supplier Utilization"
          value={`${kpis.supplierUtilization}%`}
          sublabel="Approved suppliers with active jobs"
          accent="emerald"
        />
      </KpiGrid>

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
        {usePreviewPipeline ? (
          <DataTable
            columns={previewPipelineColumns}
            rows={
              PREVIEW_PIPELINE_ROWS as unknown as (typeof PREVIEW_PIPELINE_ROWS)[number][]
            }
            rowKey={(r, i) => `${r.part}-${i}`}
            previewBanner
          />
        ) : (
          <DataTable
            columns={livePipelineColumns}
            rows={pipeline}
            rowKey={(r) => r.id}
          />
        )}
      </div>

      <SectionHeader
        title="Attention Needed"
        subtitle="Parts blocked on routing, missing data, or waiting longer than expected"
      />
      <DataTable
        columns={attentionColumns}
        rows={
          PREVIEW_ATTENTION_ROWS as unknown as (typeof PREVIEW_ATTENTION_ROWS)[number][]
        }
        rowKey={(r, i) => `${r.part}-${i}`}
        previewBanner
      />
    </>
  );
}

const previewPipelineColumns: Column<(typeof PREVIEW_PIPELINE_ROWS)[number]>[] = [
  {
    key: "part",
    header: "Part",
    render: (r) => <span className="text-slate-200">{r.part}</span>,
  },
  {
    key: "program",
    header: "Program",
    render: (r) => <span className="text-slate-400">{r.program}</span>,
  },
  {
    key: "module",
    header: "Work Package",
    render: (r) => <span className="text-slate-400">{r.module}</span>,
  },
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

const livePipelineColumns: Column<PipelineRow>[] = [
  {
    key: "job",
    header: "Job",
    render: (j) => (
      <span className="font-mono text-xs text-slate-300">
        {j.job_number ?? j.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: "rfq",
    header: "RFQ",
    render: (j) => (
      <span className="text-slate-300">
        {j.work_packages?.rfqs?.rfq_title ??
          j.work_packages?.package_name ??
          "—"}
      </span>
    ),
  },
  {
    key: "program",
    header: "Program",
    render: (j) => (
      <span className="text-slate-400">
        {j.work_packages?.rfqs?.programs?.program_name ?? "—"}
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
];

const attentionColumns: Column<(typeof PREVIEW_ATTENTION_ROWS)[number]>[] = [
  {
    key: "part",
    header: "Part",
    render: (r) => <span className="text-slate-200">{r.part}</span>,
  },
  {
    key: "program",
    header: "Program",
    render: (r) => <span className="text-slate-400">{r.program}</span>,
  },
  {
    key: "readiness",
    header: "Readiness",
    render: (r) => (
      <div className="flex items-center gap-3">
        <ProgressBar value={r.readiness} tone="emerald" />
      </div>
    ),
  },
  {
    key: "level",
    header: "Level",
    render: (r) => <span className="text-slate-400">{r.level}</span>,
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
    key: "issue",
    header: "Next Action",
    render: (r) => (
      <span className="text-xs text-amber-200/80">{r.issue}</span>
    ),
  },
];
