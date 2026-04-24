import { getOptionalUser } from "@/lib/auth";
import { listQuoteRequestsForSupplier } from "@/lib/routing/repository";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  StatusBadge,
  EmptyState,
  LinkButton,
  DataTable,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/ui/format";
import { PREVIEW_SUPPLIER_WORK_PACKAGES } from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

type LiveRequest = Awaited<
  ReturnType<typeof listQuoteRequestsForSupplier>
>[number];

async function loadRequests(orgId: string): Promise<LiveRequest[] | null> {
  try {
    return await listQuoteRequestsForSupplier(orgId);
  } catch {
    return null;
  }
}

export default async function SupplierQuoteRequestsPage() {
  const user = await getOptionalUser();
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";

  const live = isSupplier && user
    ? await loadRequests(user.organization_id)
    : null;
  const previewMode = !isSupplier || live === null;

  return (
    <>
      <PageHeader
        eyebrow="Supplier · RFQ Inbox"
        title="Quote Requests"
        subtitle="Work packages routed to your organization for quoting."
      />

      {previewMode ? (
        <>
          <PreviewDataBanner reason="No supplier session — showing illustrative work packages so the layout can be reviewed." />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PREVIEW_SUPPLIER_WORK_PACKAGES.map((r) => (
              <Card key={r.id} className="flex flex-col">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  Priority {r.priority}
                </div>
                <div className="text-sm font-medium text-slate-100">
                  {r.title}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {r.parts} parts · need-by {formatDate(r.need_by)}
                </div>
                <p className="mt-3 line-clamp-3 text-xs text-slate-400">
                  {r.description}
                </p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-amber-300">
                  Preview only
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : live!.length === 0 ? (
        <EmptyState
          title="No active quote requests"
          body="When an Asgard operator routes a work package to your organization it will appear here."
        />
      ) : (
        <div className="space-y-5">
          {live!.map((r) => {
            const priorityTone =
              r.rfq_priority === "urgent"
                ? "danger"
                : r.rfq_priority === "high"
                  ? "warn"
                  : r.rfq_priority === "low"
                    ? "neutral"
                    : "info";

            const partColumns: Column<(typeof r.parts)[number]>[] = [
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
                render: (p) => (
                  <span className="text-slate-400">{p.material ?? "—"}</span>
                ),
              },
              {
                key: "process",
                header: "Process",
                render: (p) => (
                  <span className="text-slate-400">
                    {p.process_required ?? "—"}
                  </span>
                ),
              },
              {
                key: "qty",
                header: "Qty",
                align: "right",
                render: (p) => (
                  <span className="tabular-nums text-slate-300">
                    {p.quantity ?? "—"}
                  </span>
                ),
              },
            ];

            return (
              <Card key={r.routing_decision_id}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge tone={priorityTone}>
                        {r.rfq_priority}
                      </StatusBadge>
                      <span className="text-[11px] text-slate-500">
                        Requested {formatDateTime(r.quote_requested_at)}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-100">
                      {r.rfq_title}
                    </h3>
                    {r.rfq_required_delivery_date && (
                      <div className="mt-0.5 text-xs text-slate-500">
                        Need-by {formatDate(r.rfq_required_delivery_date)}
                      </div>
                    )}
                  </div>
                  <LinkButton
                    href={`/supplier/quotes/${r.routing_decision_id}`}
                    variant="primary"
                    size="sm"
                  >
                    Respond with quote
                  </LinkButton>
                </div>

                {r.rfq_description && (
                  <p className="mb-4 text-sm text-slate-400">
                    {r.rfq_description}
                  </p>
                )}

                <SectionHeader
                  title={`Parts (${r.parts.length})`}
                  subtitle="Scope of work on this package"
                />
                <DataTable
                  columns={partColumns}
                  rows={r.parts}
                  rowKey={(p) => p.id}
                  emptyTitle="No parts on this package"
                />
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
