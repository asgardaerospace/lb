import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listRfqsForOrg } from "@/lib/rfq/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  KpiCard,
  KpiGrid,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/ui/format";
import { PREVIEW_BUYER_RFQS } from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

const SHOW_PREVIEW_FALLBACK = process.env.NODE_ENV !== "production";

interface RfqRow {
  id: string;
  rfq_title: string;
  status: string;
  priority: string;
  quantity: number | null;
  required_delivery_date: string | null;
  submitted_at: string | null;
}

async function loadRfqs(orgId: string): Promise<RfqRow[] | null> {
  try {
    const data = await listRfqsForOrg(orgId);
    return data as unknown as RfqRow[];
  } catch {
    return null;
  }
}

export default async function BuyerRfqsListPage() {
  const user = await getOptionalUser();
  const isBuyer = user?.role === "buyer_admin" || user?.role === "buyer_user";
  const live = isBuyer && user ? await loadRfqs(user.organization_id) : null;
  // Preview mock is shown only when there is no live data AND we are not
  // in production. Real authenticated buyers with empty data see the
  // proper empty state instead.
  const previewMode = (!isBuyer || live === null) && SHOW_PREVIEW_FALLBACK;
  const rfqs: RfqRow[] = previewMode
    ? (PREVIEW_BUYER_RFQS as unknown as RfqRow[]).map((r) => ({
        ...r,
        submitted_at: "2026-04-12T09:15:00Z",
      }))
    : (live ?? []);

  const draft = rfqs.filter((r) => r.status === "draft").length;
  const inFlight = rfqs.filter((r) =>
    ["submitted", "routing_in_progress", "quotes_requested"].includes(r.status),
  ).length;

  const columns: Column<RfqRow>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) =>
        previewMode ? (
          <span className="font-medium text-slate-100">{r.rfq_title}</span>
        ) : (
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
        const { label, tone } = mapStatus(rfqStatusMap, r.status);
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
        eyebrow="Buyer · RFQs"
        title="Requests for Quote"
        subtitle="All RFQs across your programs."
      />

      {previewMode && (
        <PreviewDataBanner reason="No buyer session — showing illustrative RFQs." />
      )}

      <KpiGrid>
        <KpiCard label="Total RFQs" value={rfqs.length} accent="cyan" />
        <KpiCard label="Draft" value={draft} accent="slate" />
        <KpiCard label="In Flight" value={inFlight} accent="amber" />
        <KpiCard
          label="Closed"
          value={Math.max(0, rfqs.length - draft - inFlight)}
          accent="emerald"
        />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={rfqs}
        rowKey={(r) => r.id}
        emptyTitle="No RFQs yet"
        emptyBody="Open a program and submit your first RFQ to start routing work to suppliers."
        previewBanner={previewMode}
      />
    </>
  );
}
