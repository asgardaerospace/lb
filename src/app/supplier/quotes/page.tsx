import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listSupplierInbox } from "@/lib/quotes/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  quoteStatusMap,
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function SupplierQuotesInboxPage() {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const inbox = await listSupplierInbox(user.organization_id);
  const canSubmit = user.role === "supplier_admin";

  type Row = (typeof inbox)[number];

  const columns: Column<Row>[] = [
    {
      key: "rfq",
      header: "RFQ",
      render: (e) => (
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
      render: (e) => <span className="text-slate-400">{e.work_package_name}</span>,
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
        <span className="text-slate-400">{formatDate(e.rfq_required_delivery_date)}</span>
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
          canSubmit
            ? "Submit, revise, and track your quotes against routed work packages."
            : "Read-only view of your organization's quote pipeline. Only Supplier Admin may submit or decline."
        }
      />
      <DataTable
        columns={columns}
        rows={inbox}
        rowKey={(r) => r.routing_decision_id}
        emptyTitle="No quote requests"
        emptyBody="Routed work packages will appear here when an Asgard operator requests a quote from your organization."
      />
    </>
  );
}
