import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime, relativeDaysFrom } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

interface QueueRow {
  id: string;
  rfq_title: string;
  priority: string;
  status: string;
  submitted_at: string | null;
  required_delivery_date: string | null;
}

const PREVIEW_QUEUE_ROWS: QueueRow[] = [
  {
    id: "rfq-prev-1",
    rfq_title: "Combustion chamber — short run",
    priority: "high",
    status: "submitted",
    submitted_at: "2026-04-10T14:30:00Z",
    required_delivery_date: "2026-06-10",
  },
  {
    id: "rfq-prev-2",
    rfq_title: "Avionics enclosure, A1 airframe",
    priority: "normal",
    status: "routing_in_progress",
    submitted_at: "2026-04-12T09:15:00Z",
    required_delivery_date: "2026-07-15",
  },
  {
    id: "rfq-prev-3",
    rfq_title: "Thermal bracket lot",
    priority: "low",
    status: "submitted",
    submitted_at: "2026-04-15T16:00:00Z",
    required_delivery_date: "2026-08-01",
  },
];

async function loadQueue(): Promise<QueueRow[] | null> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("rfqs")
      .select(
        "id, rfq_title, priority, status, submitted_at, required_delivery_date",
      )
      .in("status", ["submitted", "routing_in_progress"])
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) return null;
    return (data ?? []) as QueueRow[];
  } catch {
    return null;
  }
}

export default async function RoutingQueuePage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await loadQueue() : null;
  const previewMode = !isAdmin || live === null;
  const rows = previewMode ? PREVIEW_QUEUE_ROWS : live!;

  const submittedCount = rows.filter((r) => r.status === "submitted").length;
  const routingCount = rows.filter(
    (r) => r.status === "routing_in_progress",
  ).length;

  const priorityTone = (p: string) => {
    if (p === "urgent") return "danger" as const;
    if (p === "high") return "warn" as const;
    if (p === "low") return "neutral" as const;
    return "info" as const;
  };

  const columns: Column<QueueRow>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) =>
        previewMode ? (
          <span className="font-medium text-slate-100">{r.rfq_title}</span>
        ) : (
          <Link
            href={`/admin/routing/rfqs/${r.id}`}
            className="font-medium text-slate-100 transition hover:text-cyan-300"
          >
            {r.rfq_title}
          </Link>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const { label, tone } = mapStatus(rfqStatusMap, r.status);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <StatusBadge tone={priorityTone(r.priority)}>{r.priority}</StatusBadge>
      ),
    },
    {
      key: "need_by",
      header: "Need-by",
      render: (r) => (
        <span className="text-slate-400">
          {formatDate(r.required_delivery_date)}
        </span>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (r) => (
        <span className="text-slate-500">
          {formatDateTime(r.submitted_at)}
        </span>
      ),
    },
    {
      key: "days",
      header: "Days waiting",
      align: "right",
      render: (r) => {
        const d = relativeDaysFrom(r.submitted_at);
        return (
          <span className="tabular-nums text-slate-400">
            {d === null ? "—" : d}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Routing"
        title="Routing Queue"
        subtitle="RFQs ready for supplier matching — review, create work packages, and trigger the quote process."
      />

      {previewMode && (
        <PreviewDataBanner reason="No asgard_admin session — showing illustrative routing queue rows." />
      )}

      <KpiGrid>
        <KpiCard label="Submitted" value={submittedCount} accent="amber" />
        <KpiCard
          label="Routing in Progress"
          value={routingCount}
          accent="cyan"
        />
        <KpiCard label="Total in Queue" value={rows.length} accent="emerald" />
        <KpiCard
          label="Oldest (days)"
          value={
            rows
              .map((r) => relativeDaysFrom(r.submitted_at) ?? 0)
              .reduce((a, b) => Math.max(a, b), 0) || 0
          }
          accent="rose"
        />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No RFQs awaiting routing"
        emptyBody="New buyer submissions will appear here."
        previewBanner={previewMode}
      />
    </>
  );
}
