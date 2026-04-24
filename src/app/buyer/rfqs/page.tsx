import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listRfqsForOrg } from "@/lib/rfq/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  KpiCard,
  KpiGrid,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function BuyerRfqsListPage() {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const rfqs = await listRfqsForOrg(user.organization_id);

  const draft = rfqs.filter((r) => r.status === "draft").length;
  const inFlight = rfqs.filter((r) =>
    ["submitted", "routing_in_progress", "quotes_requested"].includes(r.status),
  ).length;

  type Row = (typeof rfqs)[number];
  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) => (
        <Link
          href={`/buyer/rfqs/${r.id}`}
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
        const { label, tone } = mapStatus(rfqStatusMap, r.status as string);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => <StatusBadge tone="info">{r.priority}</StatusBadge>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      render: (r) => (
        <span className="tabular-nums text-slate-400">{r.quantity ?? "—"}</span>
      ),
    },
    {
      key: "need",
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
  ];

  return (
    <>
      <PageHeader
        eyebrow="Buyer · RFQs"
        title="Requests for Quote"
        subtitle="All RFQs across your programs."
      />

      <KpiGrid>
        <KpiCard label="Total RFQs" value={rfqs.length} accent="cyan" />
        <KpiCard label="Draft" value={draft} accent="slate" />
        <KpiCard label="In Flight" value={inFlight} accent="amber" />
        <KpiCard
          label="Closed"
          value={rfqs.length - draft - inFlight}
          accent="emerald"
        />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={rfqs}
        rowKey={(r) => r.id}
        emptyTitle="No RFQs yet"
        emptyBody="Open a program and submit your first RFQ to start routing work to suppliers."
      />
    </>
  );
}
