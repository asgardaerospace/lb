import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { getRfqById, listPartsForRfq } from "@/lib/rfq/repository";
import { listWorkPackagesForRfq } from "@/lib/routing/repository";
import WorkPackageCreateForm from "./WorkPackageCreateForm";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DataTable,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  RequiresLiveData,
  WorkflowStepper,
  type Column,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RoutingRfqPage({
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
          eyebrow="Admin · Routing Engine"
          title={id.slice(0, 8)}
          subtitle="Routing engine requires an authenticated asgard_admin session."
        />
        <RequiresLiveData
          reason="The routing engine builds on live work-package, candidate-supplier, and routing-decision data from Supabase."
          backHref="/admin/routing"
          backLabel="Back to Routing Queue preview"
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
        <PageHeader eyebrow="Admin · Routing Engine" title={id.slice(0, 8)} />
        <RequiresLiveData
          reason="Could not reach Supabase to load this RFQ."
          backHref="/admin/routing"
          backLabel="Back to Routing Queue"
        />
      </>
    );
  }
  if (!rfq) notFound();

  const [parts, packages] = await Promise.all([
    listPartsForRfq(id),
    listWorkPackagesForRfq(id),
  ]);

  const { label, tone } = mapStatus(rfqStatusMap, rfq.status);

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
        eyebrow="Admin · Routing Engine"
        title={rfq.rfq_title}
        subtitle="Assemble work packages, select candidate suppliers, and trigger quote requests."
        actions={
          <div className="flex gap-1.5">
            <StatusBadge tone={tone}>{label}</StatusBadge>
            <StatusBadge tone="info">{rfq.priority}</StatusBadge>
          </div>
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
          currentKey="routing"
        />
      </div>

      <SectionHeader
        title={`Parts (${parts.length})`}
        subtitle="Scope of work defined by the buyer"
      />
      <div className="mb-6">
        <DataTable
          columns={partCols}
          rows={parts}
          rowKey={(p) => p.id}
          emptyTitle="No parts on this RFQ"
        />
      </div>

      <SectionHeader
        title={`Work packages (${packages.length})`}
        subtitle="Routable units of work created from this RFQ"
      />
      <div className="mb-6">
        {packages.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">
              No work packages yet. Create one below to begin routing.
            </p>
          </Card>
        ) : (
          <ul className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
            {packages.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <Link
                  href={`/admin/work-packages/${p.id}`}
                  className="font-medium text-slate-100 transition hover:text-cyan-300"
                >
                  {p.package_name}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {p.package_type ?? "—"}
                  </span>
                  <StatusBadge tone={p.status === "routed" ? "success" : "info"}>
                    {p.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SectionHeader
        title="Create work package"
        subtitle="Group parts and attach candidate suppliers"
      />
      <Card>
        <WorkPackageCreateForm rfqId={id} />
      </Card>
    </>
  );
}
