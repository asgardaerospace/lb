import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { getProfileForOrg } from "@/lib/supplier-profile/repository";
import SupplierProfileForm from "./SupplierProfileForm";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  StatusBadge,
  mapStatus,
  supplierStatusMap,
  Card,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SupplierProfilePage() {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const profile = await getProfileForOrg(user.organization_id);
  const canEdit = user.role === "supplier_admin";
  const { label, tone } = mapStatus(
    supplierStatusMap,
    profile?.approval_status ?? "draft",
  );

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Qualification"
        title="Company Profile"
        subtitle="Maintain your organization's manufacturing capability, compliance evidence, and review metadata."
        actions={<StatusBadge tone={tone}>{label}</StatusBadge>}
      />
      <Card>
        <SupplierProfileForm initial={profile} canEdit={canEdit} />
      </Card>
    </>
  );
}
