import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listRfqsByStatus } from "@/lib/rfq/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function AdminRfqsPage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const rfqs = await listRfqsByStatus(["submitted"]);

  type Row = (typeof rfqs)[number];
  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) => (
        <Link
          href={`/admin/rfqs/${r.id}`}
          className="font-medium text-slate-100 transition hover:text-cyan-300"
        >
          {r.rfq_title}
        </Link>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => <StatusBadge tone="info">{r.priority}</StatusBadge>,
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
      key: "qty",
      header: "Qty",
      align: "right",
      render: (r) => <span className="tabular-nums text-slate-400">{r.quantity ?? "—"}</span>,
    },
    {
      key: "need",
      header: "Need-by",
      render: (r) => <span className="text-slate-400">{formatDate(r.required_delivery_date)}</span>,
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (r) => <span className="text-slate-500">{formatDateTime(r.submitted_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · RFQ Inbox"
        title="Submitted RFQs"
        subtitle="All RFQs submitted by buyers that are ready to be triaged into work packages."
      />
      <DataTable
        columns={columns}
        rows={rfqs}
        rowKey={(r) => r.id}
        emptyTitle="No submitted RFQs"
        emptyBody="Buyers have not submitted new RFQs. The Routing Queue shows RFQs already being worked."
      />
    </>
  );
}
