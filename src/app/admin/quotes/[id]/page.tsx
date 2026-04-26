import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { getQuoteById } from "@/lib/quotes/repository";
import {
  getWorkPackageById,
  listPartsForWorkPackage,
} from "@/lib/routing/repository";
import { createServerSupabase } from "@/lib/supabase/server";
import QuoteReviewActions from "./QuoteReviewActions";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DataTable,
  DocumentChain,
  DocumentsSection,
  StatusBadge,
  mapStatus,
  quoteStatusMap,
  RequiresLiveData,
  type Column,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/ui/format";
import { loadDocumentsForPage } from "@/lib/documents/load";
import { loadDocumentChainForQuote } from "@/lib/documents/chain";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOptionalUser();
  const { id } = await params;

  if (user?.role !== "asgard_admin") {
    return (
      <>
        <PageHeader
          eyebrow="Admin · Quote Review"
          title={id.slice(0, 8)}
          subtitle="Quote review requires an authenticated asgard_admin session."
        />
        <RequiresLiveData
          reason="Per-quote detail relies on live Supabase data and the asgard_admin role."
          backHref="/admin/quotes"
          backLabel="Back to Quote Pipeline preview"
        />
      </>
    );
  }

  let quote: Awaited<ReturnType<typeof getQuoteById>> | null = null;
  try {
    quote = await getQuoteById(id);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Admin · Quote Review" title={id.slice(0, 8)} />
        <RequiresLiveData
          reason="Could not reach Supabase to load this quote."
          backHref="/admin/quotes"
          backLabel="Back to Quote Pipeline"
        />
      </>
    );
  }
  if (!quote) notFound();

  const supabase = await createServerSupabase();
  const [wp, parts, orgRow, quoteDocs] = await Promise.all([
    getWorkPackageById(quote.work_package_id),
    listPartsForWorkPackage(quote.work_package_id),
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", quote.supplier_organization_id)
      .maybeSingle()
      .then((r) => r.data as { id: string; name: string } | null),
    loadDocumentsForPage("quote", quote.id),
  ]);
  const chain = await loadDocumentChainForQuote(quote.id).catch(() => null);

  const { label, tone } = mapStatus(quoteStatusMap, quote.status);

  type Part = (typeof parts)[number];
  const partColumns: Column<Part>[] = [
    {
      key: "pn",
      header: "Part #",
      render: (p) => (
        <span className="font-mono text-xs text-slate-200">
          {p.part_number}
        </span>
      ),
    },
    {
      key: "material",
      header: "Material",
      render: (p) => <span className="text-slate-400">{p.material ?? "—"}</span>,
    },
    {
      key: "process",
      header: "Process",
      render: (p) => (
        <span className="text-slate-400">{p.process_required ?? "—"}</span>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      render: (p) => (
        <span className="tabular-nums text-slate-300">{p.quantity ?? "—"}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Quote Review"
        title={`Quote from ${orgRow?.name ?? "(unknown supplier)"}`}
        subtitle={wp ? `Work package · ${wp.package_name}` : undefined}
        back={{ href: "/admin/quotes", label: "All quotes" }}
        actions={<StatusBadge tone={tone}>{label}</StatusBadge>}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Price
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
            {formatCurrency(quote.quoted_price)}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Lead time
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
            {quote.lead_time_days ?? "—"}
            {quote.lead_time_days != null && (
              <span className="ml-1 text-xs text-slate-500">days</span>
            )}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Min order qty
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
            {quote.minimum_order_quantity ?? "—"}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Submitted
          </div>
          <div className="mt-1 text-sm text-slate-200">
            {formatDateTime(quote.submitted_at)}
          </div>
        </Card>
      </div>

      {(quote.quote_notes || quote.review_notes) && (
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          {quote.quote_notes && (
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Supplier notes
              </div>
              <p className="mt-1 text-sm text-slate-300">{quote.quote_notes}</p>
            </Card>
          )}
          {quote.review_notes && (
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Review notes
              </div>
              <p className="mt-1 text-sm text-slate-300">{quote.review_notes}</p>
            </Card>
          )}
        </div>
      )}

      <SectionHeader title={`Parts on this package (${parts.length})`} />
      <div className="mb-5">
        <DataTable
          columns={partColumns}
          rows={parts}
          rowKey={(p) => p.id}
          emptyTitle="No parts attached"
        />
      </div>

      <Card>
        <QuoteReviewActions quoteId={quote.id} status={quote.status} />
      </Card>

      <SectionHeader
        title="Quote attachments"
        subtitle="Manufacturability notes and supporting docs from the supplier."
      />
      <Card>
        <DocumentsSection
          entityType="quote"
          entityId={quote.id}
          canUpload
          storageReady={quoteDocs.storageReady}
          initialDocuments={quoteDocs.documents}
          emptyHint="Supplier has not attached any documents to this quote."
        />
      </Card>

      {chain && (
        <>
          <SectionHeader
            title="Document chain"
            subtitle="Every document linked along this RFQ → Quote lineage, in one place."
          />
          <Card>
            <DocumentChain snapshot={chain} />
          </Card>
        </>
      )}
    </>
  );
}
