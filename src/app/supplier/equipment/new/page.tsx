import { getOptionalUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Card,
  LinkButton,
  PreviewDataBanner,
  RequiresLiveData,
} from "@/components/ui";
import { AddMachineForm } from "./AddMachineForm";

export const dynamic = "force-dynamic";

export default async function AddEquipmentPage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Supplier · Capability"
          title="Add Equipment"
          subtitle="Declare a new machine in your capability envelope."
          back={{ href: "/supplier/equipment", label: "Equipment" }}
        />
        <RequiresLiveData
          reason="Adding equipment requires an authenticated supplier session."
          backHref="/supplier/equipment"
          backLabel="Back to Equipment"
        />
      </>
    );
  }

  if (user.role !== "supplier_admin") {
    return (
      <>
        <PageHeader
          eyebrow="Supplier · Capability"
          title="Add Equipment"
          subtitle="Declare a new machine in your capability envelope."
          back={{ href: "/supplier/equipment", label: "Equipment" }}
        />
        <PreviewDataBanner reason="Only supplier admins can add or remove equipment. Ask an admin in your organization to make changes." />
        <div className="mt-3">
          <LinkButton href="/supplier/equipment" variant="secondary" size="sm">
            ← Back to Equipment
          </LinkButton>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Capability"
        title="Add Equipment"
        subtitle="Declare a new machine in your capability envelope."
        back={{ href: "/supplier/equipment", label: "Equipment" }}
      />

      <Card>
        <AddMachineForm />
      </Card>
    </>
  );
}
