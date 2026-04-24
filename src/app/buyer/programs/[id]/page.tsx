import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import {
  getProgramById,
  listRfqsForProgram,
} from "@/lib/rfq/repository";
import RfqCreateForm from "./RfqCreateForm";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DataTable,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const { id } = await params;
  const program = await getProgramById(id);
  if (!program || program.buyer_organization_id !== user.organization_id) {
    notFound();
  }
  const rfqs = await listRfqsForProgram(id);

  type Row = (typeof rfqs)[number];
  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "RFQ",
      render: (r) => (
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
        const { label, tone } = mapStatus(rfqStatusMap, r.status as string);
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
  ];

  return (
    <>
      <PageHeader
        eyebrow="Buyer · Program Detail"
        title={program.program_name}
        subtitle={program.description ?? undefined}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge
              tone={program.status === "active" ? "success" : "neutral"}
            >
              {program.status}
            </StatusBadge>
            {program.itar_controlled && (
              <StatusBadge tone="warn">ITAR</StatusBadge>
            )}
            {program.cui_controlled && (
              <StatusBadge tone="warn">CUI</StatusBadge>
            )}
          </div>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Type
          </div>
          <div className="mt-1 text-sm text-slate-200">
            {program.program_type ?? "—"}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Compliance
          </div>
          <div className="mt-1 text-sm text-slate-200">
            {program.compliance_level ?? "Standard"}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            RFQs
          </div>
          <div className="mt-1 text-sm text-slate-200">{rfqs.length}</div>
        </Card>
      </div>

      <SectionHeader
        title="Requests for Quote"
        subtitle="All RFQs submitted under this program"
      />
      <div className="mb-8">
        <DataTable
          columns={columns}
          rows={rfqs}
          rowKey={(r) => r.id}
          emptyTitle="No RFQs yet"
          emptyBody="Submit the first RFQ for this program below."
        />
      </div>

      <SectionHeader
        title="Submit new RFQ"
        subtitle="Attach parts, quantity, and delivery requirements"
      />
      <Card>
        <RfqCreateForm programId={program.id} />
      </Card>
    </>
  );
}
