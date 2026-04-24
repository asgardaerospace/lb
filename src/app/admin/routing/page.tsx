import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
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

export default async function RoutingQueuePage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("rfqs")
    .select(
      "id, rfq_title, priority, status, submitted_at, required_delivery_date",
    )
    .in("status", ["submitted", "routing_in_progress"])
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const rows = (data ?? []) as QueueRow[];

  const submittedCount = rows.filter((r) => r.status === "submitted").length;
  const routingCount = rows.filter((r) => r.status === "routing_in_progress").length;

  const priorityTone = (p: string) => {
    if (p === "urgent") return "danger";
    if (p === "high") return "warn";
    if (p === "low") return "neutral";
    return "info";
  };

  const columns: Column<QueueRow>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) => (
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
        <span className="text-slate-400">{formatDate(r.required_delivery_date)}</span>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (r) => (
        <span className="text-slate-500">{formatDateTime(r.submitted_at)}</span>
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

      <KpiGrid>
        <KpiCard
          label="Submitted"
          value={submittedCount}
          sublabel="Awaiting triage"
          accent="amber"
        />
        <KpiCard
          label="Routing in Progress"
          value={routingCount}
          sublabel="Work packages open"
          accent="cyan"
        />
        <KpiCard
          label="Total in Queue"
          value={rows.length}
          sublabel="All non-closed RFQs"
          accent="emerald"
        />
        <KpiCard
          label="Oldest (days)"
          value={
            rows
              .map((r) => relativeDaysFrom(r.submitted_at) ?? 0)
              .reduce((a, b) => Math.max(a, b), 0) || 0
          }
          sublabel="Longest wait"
          accent="rose"
        />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        emptyTitle="No RFQs awaiting routing"
        emptyBody="New buyer submissions will appear here. Open the RFQ inbox to see closed items."
      />
    </>
  );
}
