import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listQuoteRequestsForSupplier } from "@/lib/routing/repository";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  StatusBadge,
  EmptyState,
  LinkButton,
  DataTable,
  type Column,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function SupplierQuoteRequestsPage() {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const requests = await listQuoteRequestsForSupplier(user.organization_id);

  return (
    <>
      <PageHeader
        eyebrow="Supplier · RFQ Inbox"
        title="Quote Requests"
        subtitle="Work packages routed to your organization for quoting."
      />

      {requests.length === 0 ? (
        <EmptyState
          title="No active quote requests"
          body="When an Asgard operator routes a work package to your organization it will appear here."
        />
      ) : (
        <div className="space-y-5">
          {requests.map((r) => {
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
