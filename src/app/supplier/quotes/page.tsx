import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listSupplierInbox } from "@/lib/quotes/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  quoteStatusMap,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listSupplierInbox>>[number];

const PREVIEW_INBOX = [
  {
    routing_decision_id: "rd-prev-1",
    work_package_id: "wp-prev-1",
    work_package_name: "Combustion chamber assembly",
    rfq_title: "Combustion chamber — short run",
    rfq_priority: "high",
    rfq_required_delivery_date: "2026-06-10",
    quote_requested_at: "2026-04-15T09:00:00Z",
    existing_quote: null,
  },
  {
    routing_decision_id: "rd-prev-2",
    work_package_id: "wp-prev-2",
    work_package_name: "Avionics enclosure batch",
    rfq_title: "Avionics enclosure, A1 airframe",
    rfq_priority: "normal",
    rfq_required_delivery_date: "2026-07-15",
    quote_requested_at: "2026-04-12T11:00:00Z",
    existing_quote: { status: "submitted" },
  },
] as unknown as Row[];

async function loadInbox(orgId: string): Promise<Row[] | null> {
  try {
    return await listSupplierInbox(orgId);
  } catch {
    return null;
  }
}

export default async function SupplierQuotesInboxPage() {
  const user = await getOptionalUser();
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";
  const live = isSupplier && user ? await loadInbox(user.organization_id) : null;
  const previewMode = !isSupplier || live === null;
  const inbox = previewMode ? PREVIEW_INBOX : live!;
  const canSubmit = user?.role === "supplier_admin";

  const columns: Column<Row>[] = [
    {
      key: "rfq",
      header: "RFQ",
      render: (e) =>
        previewMode ? (
          <span className="font-medium text-slate-100">{e.rfq_title}</span>
        ) : (
          <Link
            href={`/supplier/quotes/${e.routing_decision_id}`}
            className="font-medium text-slate-100 transition hover:text-cyan-300"
          >
            {e.rfq_title}
          </Link>
        ),
    },
    {
      key: "wp",
      header: "Work package",
      render: (e) => (
        <span className="text-slate-400">{e.work_package_name}</span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (e) => <StatusBadge tone="info">{e.rfq_priority}</StatusBadge>,
    },
    {
      key: "need",
      header: "Need-by",
      render: (e) => (
        <span className="text-slate-400">
          {formatDate(e.rfq_required_delivery_date)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => {
        if (!e.existing_quote) {
          return <StatusBadge tone="warn">Awaiting response</StatusBadge>;
        }
        const { label, tone } = mapStatus(
          quoteStatusMap,
          e.existing_quote.status,
        );
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Quote Pipeline"
        title="Quotes"
        subtitle={
          previewMode
            ? "Preview of your quote pipeline. Connect Supabase to load live data."
            : canSubmit
              ? "Submit, revise, and track your quotes against routed work packages."
              : "Read-only view of your organization's quote pipeline. Only Supplier Admin may submit or decline."
        }
      />
      {previewMode && (
        <PreviewDataBanner reason="No supplier session — showing illustrative quote-pipeline rows." />
      )}
      <DataTable
        columns={columns}
        rows={inbox}
        rowKey={(r) => r.routing_decision_id}
        emptyTitle="No quote requests"
        emptyBody="Routed work packages will appear here when an Asgard operator requests a quote from your organization."
        previewBanner={previewMode}
      />
    </>
  );
}
