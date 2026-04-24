import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  LinkButton,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { PREVIEW_EQUIPMENT } from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

export default async function SupplierEquipmentPage() {
  try {
    await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  type Row = (typeof PREVIEW_EQUIPMENT)[number];
  const columns: Column<Row>[] = [
    {
      key: "type",
      header: "Machine type",
      render: (r) => <span className="text-slate-100">{r.machine_type}</span>,
    },
    {
      key: "materials",
      header: "Materials supported",
      render: (r) => <span className="text-slate-400">{r.materials}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (r) => <span className="text-slate-400">{r.capacity}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Capability"
        title="Company Equipment"
        subtitle="Maintain your machine list so the routing engine can match work to your capability envelope."
        actions={
          <LinkButton href="/supplier/equipment/new" variant="primary" size="sm">
            + Add Equipment
          </LinkButton>
        }
      />

      <PreviewDataBanner reason="Equipment API is not yet wired. This screen shows illustrative data so you can review layout and intent. Machines table exists in schema — backend endpoint is blocked." />

      <DataTable
        columns={columns}
        rows={PREVIEW_EQUIPMENT as unknown as Row[]}
        rowKey={(r) => r.machine_type}
        previewBanner
      />
    </>
  );
}
