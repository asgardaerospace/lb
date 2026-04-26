import { getOptionalUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Banner,
  Card,
  DataTable,
  LinkButton,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { PREVIEW_EQUIPMENT } from "@/lib/ui/mock";
import {
  listCapabilities,
  listMachines,
} from "@/lib/equipment/repository";
import type { Capability, Machine } from "@/lib/equipment/types";
import { EquipmentManager } from "./EquipmentManager";

export const dynamic = "force-dynamic";

export default async function SupplierEquipmentPage() {
  const user = await getOptionalUser();
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";

  if (!user || !isSupplier) {
    return <PreviewView />;
  }

  let machines: Machine[] = [];
  let capabilities: Capability[] = [];
  let loadError: string | null = null;
  try {
    [machines, capabilities] = await Promise.all([
      listMachines(user.organization_id),
      listCapabilities(user.organization_id),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load equipment";
  }

  const canEdit = user.role === "supplier_admin";

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Capability"
        title="Company Equipment"
        subtitle="Maintain your machine list and process capabilities so the routing engine can match work to your envelope."
        actions={
          canEdit ? (
            <LinkButton href="/supplier/equipment/new" variant="primary" size="sm">
              + Add Equipment
            </LinkButton>
          ) : undefined
        }
      />

      {loadError && (
        <div className="mb-4">
          <Banner tone="error" title="Could not load equipment">
            {loadError}
          </Banner>
        </div>
      )}

      <Card>
        <EquipmentManager
          initialMachines={machines.map((m) => ({
            id: m.id,
            machine_type: m.machine_type,
            materials_supported: m.materials_supported,
            capacity: m.capacity,
          }))}
          initialCapabilities={capabilities.map((c) => ({
            id: c.id,
            process_type: c.process_type,
            materials_supported: c.materials_supported,
          }))}
          canEdit={canEdit}
        />
      </Card>
    </>
  );
}

function PreviewView() {
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

      <PreviewDataBanner reason="Sign in as a supplier to manage your real equipment list. This screen is illustrative." />

      <DataTable
        columns={columns}
        rows={PREVIEW_EQUIPMENT as unknown as Row[]}
        rowKey={(r) => r.machine_type}
        previewBanner
      />
    </>
  );
}
