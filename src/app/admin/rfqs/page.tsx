import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listRfqsByStatus } from "@/lib/rfq/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

interface RfqRow {
  id: string;
  rfq_title: string;
  priority: string;
  status: string;
  quantity: number | null;
  required_delivery_date: string | null;
  submitted_at: string | null;
}

const PREVIEW_RFQS: RfqRow[] = [
  {
    id: "rfq-prev-1",
    rfq_title: "Combustion chamber — short run",
    priority: "high",
    status: "submitted",
    quantity: 12,
    required_delivery_date: "2026-06-10",
    submitted_at: "2026-04-10T14:30:00Z",
  },
  {
    id: "rfq-prev-2",
    rfq_title: "Avionics enclosure, A1 airframe",
    priority: "normal",
    status: "submitted",
    quantity: 40,
    required_delivery_date: "2026-07-15",
    submitted_at: "2026-04-12T09:15:00Z",
  },
];

async function loadRfqs(): Promise<RfqRow[] | null> {
  try {
    const data = await listRfqsByStatus(["submitted"]);
    return data as unknown as RfqRow[];
  } catch {
    return null;
  }
}

export default async function AdminRfqsPage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await loadRfqs() : null;
  const previewMode = !isAdmin || live === null;
  const rfqs = previewMode ? PREVIEW_RFQS : live!;

  const columns: Column<RfqRow>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) =>
        previewMode ? (
          <span className="font-medium text-slate-100">{r.rfq_title}</span>
        ) : (
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
        const { label, tone } = mapStatus(rfqStatusMap, r.status);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
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
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · RFQ Inbox"
        title="Submitted RFQs"
        subtitle="All RFQs submitted by buyers that are ready to be triaged into work packages."
      />
      {previewMode && (
        <PreviewDataBanner reason="No asgard_admin session — showing illustrative RFQ rows." />
      )}
      <DataTable
        columns={columns}
        rows={rfqs}
        rowKey={(r) => r.id}
        emptyTitle="No submitted RFQs"
        emptyBody="Buyers have not submitted new RFQs."
        previewBanner={previewMode}
      />
    </>
  );
}
