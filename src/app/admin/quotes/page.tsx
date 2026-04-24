import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listQuotesByStatus } from "@/lib/quotes/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  mapStatus,
  quoteStatusMap,
  type Column,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const quotes = await listQuotesByStatus(["submitted", "under_review"]);

  const submitted = quotes.filter((q) => q.status === "submitted").length;
  const underReview = quotes.filter((q) => q.status === "under_review").length;
  const totalValue = quotes.reduce(
    (acc, q) => acc + (Number(q.quoted_price) || 0),
    0,
  );

  type Row = (typeof quotes)[number];
  const columns: Column<Row>[] = [
    {
      key: "id",
      header: "Quote ID",
      render: (q) => (
        <Link
          href={`/admin/quotes/${q.id}`}
          className="font-mono text-xs text-cyan-300 transition hover:text-cyan-200"
        >
          {q.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "wp",
      header: "Work package",
      render: (q) => (
        <span className="font-mono text-xs text-slate-400">
          {q.work_package_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier org",
      render: (q) => (
        <span className="font-mono text-xs text-slate-400">
          {q.supplier_organization_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (q) => (
        <span className="tabular-nums text-slate-200">
          {formatCurrency(q.quoted_price)}
        </span>
      ),
    },
    {
      key: "lead",
      header: "Lead (days)",
      align: "right",
      render: (q) => (
        <span className="tabular-nums text-slate-400">
          {q.lead_time_days ?? "—"}
        </span>
      ),
    },
    {
      key: "moq",
      header: "MOQ",
      align: "right",
      render: (q) => (
        <span className="tabular-nums text-slate-400">
          {q.minimum_order_quantity ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (q) => {
        const { label, tone } = mapStatus(quoteStatusMap, q.status as string);
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (q) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(q.submitted_at)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Quotes"
        title="Quote Pipeline"
        subtitle="All supplier quote requests across the platform — track pending, submitted, and under-review quotes."
      />

      <KpiGrid>
        <KpiCard label="Total Awaiting Review" value={quotes.length} accent="cyan" />
        <KpiCard label="Submitted" value={submitted} accent="emerald" />
        <KpiCard label="Under Review" value={underReview} accent="amber" />
        <KpiCard
          label="Value in Review"
          value={formatCurrency(totalValue)}
          accent="cyan"
        />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={quotes}
        rowKey={(q) => q.id}
        emptyTitle="No quotes awaiting review"
        emptyBody="Submitted quotes from suppliers will land here for acceptance or rejection."
      />
    </>
  );
}
