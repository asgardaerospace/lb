import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { loadRequestForSupplier } from "@/lib/quotes/access";
import { getQuoteFor } from "@/lib/quotes/repository";
import { listPartsForWorkPackage } from "@/lib/routing/repository";
import { createServerSupabase } from "@/lib/supabase/server";
import QuoteResponseForm from "./QuoteResponseForm";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DataTable,
  RequiresLiveData,
  StatusBadge,
  WorkflowStepper,
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/ui/format";
import { AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SupplierQuoteDetailPage({
  params,
}: {
  params: Promise<{ rdId: string }>;
}) {
  const user = await getOptionalUser();
  const { rdId } = await params;
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";

  if (!isSupplier || !user) {
    return (
      <>
        <PageHeader
          eyebrow="Supplier · Quote"
          title="Quote response"
          subtitle="Quote response requires an authenticated supplier session."
        />
        <RequiresLiveData
          reason="Routing decisions are scoped to your supplier organization. Sign in to load this quote request."
          backHref="/supplier/quotes"
          backLabel="Back to Quotes preview"
        />
      </>
    );
  }

  let rd;
  try {
    rd = await loadRequestForSupplier(rdId, user.organization_id);
  } catch (err) {
    if (err instanceof AuthError && (err.status === 403 || err.status === 404)) {
      notFound();
    }
    return (
      <>
        <PageHeader eyebrow="Supplier · Quote" title="Quote response" />
        <RequiresLiveData
          reason="Could not reach Supabase to load this routing decision."
          backHref="/supplier/quotes"
          backLabel="Back to Quotes"
        />
      </>
    );
  }

  const supabase = await createServerSupabase();
  const { data: wpRow } = await supabase
    .from("work_packages")
    .select("id, package_name, package_type, description, rfq_id")
    .eq("id", rd.work_package_id)
    .maybeSingle();
  const wp = wpRow as {
    id: string;
    package_name: string;
    package_type: string | null;
    description: string | null;
    rfq_id: string;
  } | null;
  if (!wp) notFound();

  const { data: rfqRow } = await supabase
    .from("rfqs")
    .select("rfq_title, description, priority, required_delivery_date")
    .eq("id", wp.rfq_id)
    .maybeSingle();
  const rfq = rfqRow as {
    rfq_title: string;
    description: string | null;
    priority: string;
    required_delivery_date: string | null;
  } | null;

  const [parts, existing] = await Promise.all([
    listPartsForWorkPackage(wp.id),
    getQuoteFor(wp.id, user.organization_id),
  ]);

  const canAct = user.role === "supplier_admin";

  type Part = (typeof parts)[number];
  const partCols: Column<Part>[] = [
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
        eyebrow={`Supplier · Quote${wp.package_name ? ` · ${wp.package_name}` : ""}`}
        title={rfq?.rfq_title ?? "Quote request"}
        subtitle={wp.description ?? undefined}
        actions={
          rfq ? (
            <div className="flex gap-1.5">
              <StatusBadge tone="info">{rfq.priority}</StatusBadge>
              {rfq.required_delivery_date && (
                <StatusBadge tone="neutral" dot={false}>
                  Need-by {formatDate(rfq.required_delivery_date)}
                </StatusBadge>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mb-6">
        <WorkflowStepper
          steps={[
            { key: "rfq", label: "RFQ" },
            { key: "routing", label: "Routing" },
            { key: "quote", label: "Quote" },
            { key: "job", label: "Job" },
          ]}
          currentKey="quote"
        />
      </div>

      <SectionHeader title={`Parts on this package (${parts.length})`} />
      <div className="mb-5">
        <DataTable
          columns={partCols}
          rows={parts}
          rowKey={(p) => p.id}
          emptyTitle="No parts attached"
        />
      </div>

      <SectionHeader
        title="Your quote response"
        subtitle={
          canAct
            ? "Submit price, lead time, MOQ, and any notes."
            : "Read-only — only Supplier Admin may submit or decline."
        }
      />
      <Card>
        <QuoteResponseForm
          routingDecisionId={rd.id}
          existing={existing}
          canAct={canAct}
        />
      </Card>
    </>
  );
}
