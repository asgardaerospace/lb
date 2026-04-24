import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listQuotesByStatus } from "@/lib/quotes/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  mapStatus,
  quoteStatusMap,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

interface QuoteRow {
  id: string;
  work_package_id: string;
  supplier_organization_id: string;
  quoted_price: number | null;
  lead_time_days: number | null;
  minimum_order_quantity: number | null;
  status: string;
  submitted_at: string | null;
}

const PREVIEW_QUOTES: QuoteRow[] = [
  {
    id: "q-prev-1",
    work_package_id: "wp-prev-1",
    supplier_organization_id: "org-prev-1",
    quoted_price: 22000,
    lead_time_days: 60,
    minimum_order_quantity: 1,
    status: "submitted",
    submitted_at: "2026-04-15T15:30:00Z",
  },
  {
    id: "q-prev-2",
    work_package_id: "wp-prev-2",
    supplier_organization_id: "org-prev-2",
    quoted_price: 5500,
    lead_time_days: 14,
    minimum_order_quantity: 4,
    status: "under_review",
    submitted_at: "2026-04-16T11:00:00Z",
  },
  {
    id: "q-prev-3",
    work_package_id: "wp-prev-3",
    supplier_organization_id: "org-prev-1",
    quoted_price: 3100,
    lead_time_days: 21,
    minimum_order_quantity: 1,
    status: "submitted",
    submitted_at: "2026-04-17T09:00:00Z",
  },
];

async function loadQuotes(): Promise<QuoteRow[] | null> {
  try {
    const data = await listQuotesByStatus(["submitted", "under_review"]);
    return data as unknown as QuoteRow[];
  } catch {
    return null;
  }
}

export default async function AdminQuotesPage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await loadQuotes() : null;
  const previewMode = !isAdmin || live === null;
  const quotes = previewMode ? PREVIEW_QUOTES : live!;

  const submitted = quotes.filter((q) => q.status === "submitted").length;
  const underReview = quotes.filter(
    (q) => q.status === "under_review",
  ).length;
  const totalValue = quotes.reduce(
    (acc, q) => acc + (Number(q.quoted_price) || 0),
    0,
  );

  const columns: Column<QuoteRow>[] = [
    {
      key: "id",
      header: "Quote ID",
      render: (q) =>
        previewMode ? (
          <span className="font-mono text-xs text-slate-400">
            {q.id.slice(0, 8)}
          </span>
        ) : (
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
        const { label, tone } = mapStatus(quoteStatusMap, q.status);
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

      {previewMode && (
        <PreviewDataBanner reason="No asgard_admin session — showing illustrative quote rows." />
      )}

      <KpiGrid>
        <KpiCard
          label="Total Awaiting Review"
          value={quotes.length}
          accent="cyan"
        />
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
        previewBanner={previewMode}
      />
    </>
  );
}
