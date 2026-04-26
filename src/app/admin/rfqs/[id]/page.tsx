import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import {
  getProgramById,
  getRfqById,
  listPartsForRfq,
} from "@/lib/rfq/repository";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DataTable,
  DocumentsSection,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  RequiresLiveData,
  type Column,
} from "@/components/ui";
import { loadDocumentsForPage } from "@/lib/documents/load";

export const dynamic = "force-dynamic";

export default async function AdminRfqDetailPage({
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
          eyebrow="Admin · RFQ Detail"
          title={id.slice(0, 8)}
          subtitle="RFQ detail requires an authenticated asgard_admin session."
        />
        <RequiresLiveData
          reason="Per-RFQ detail relies on live Supabase data and the asgard_admin role."
          backHref="/admin/rfqs"
          backLabel="Back to RFQ Inbox preview"
        />
      </>
    );
  }

  let rfq: Awaited<ReturnType<typeof getRfqById>> | null = null;
  try {
    rfq = await getRfqById(id);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Admin · RFQ Detail" title={id.slice(0, 8)} />
        <RequiresLiveData
          reason="Could not reach Supabase to load this RFQ."
          backHref="/admin/rfqs"
          backLabel="Back to RFQ Inbox"
        />
      </>
    );
  }
  if (!rfq) notFound();
  const [program, parts, docs] = await Promise.all([
    getProgramById(rfq.program_id),
    listPartsForRfq(id),
    loadDocumentsForPage("rfq", id),
  ]);

  const { label, tone } = mapStatus(rfqStatusMap, rfq.status);

  type Part = (typeof parts)[number];
  const columns: Column<Part>[] = [
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
      key: "name",
      header: "Name",
      render: (p) => (
        <span className="text-slate-300">{p.part_name ?? "—"}</span>
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
        eyebrow={`Admin · RFQ${program ? ` · ${program.program_name}` : ""}`}
        title={rfq.rfq_title}
        subtitle={rfq.description ?? undefined}
        back={{ href: "/admin/rfqs", label: "RFQ Inbox" }}
        actions={
          <div className="flex gap-1.5">
            <StatusBadge tone={tone}>{label}</StatusBadge>
            <StatusBadge tone="info">{rfq.priority}</StatusBadge>
            {program?.itar_controlled && (
              <StatusBadge tone="warn">ITAR</StatusBadge>
            )}
            {program?.cui_controlled && (
              <StatusBadge tone="warn">CUI</StatusBadge>
            )}
          </div>
        }
      />

      <SectionHeader title={`Parts (${parts.length})`} />
      <DataTable
        columns={columns}
        rows={parts}
        rowKey={(p) => p.id}
        emptyTitle="No parts on this RFQ"
      />

      <div className="mt-6">
        <SectionHeader
          title="RFQ documents"
          subtitle="CAD and specifications attached by the buyer."
        />
        <Card>
          <DocumentsSection
            entityType="rfq"
            entityId={id}
            canUpload={false}
            storageReady={docs.storageReady}
            initialDocuments={docs.documents}
            emptyHint="Buyer has not attached any documents to this RFQ."
          />
        </Card>
      </div>
    </>
  );
}
