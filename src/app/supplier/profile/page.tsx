import { getOptionalUser } from "@/lib/auth";
import { getProfileForOrg } from "@/lib/supplier-profile/repository";
import SupplierProfileForm from "./SupplierProfileForm";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  StatusBadge,
  mapStatus,
  supplierStatusMap,
  Card,
  PreviewDataBanner,
} from "@/components/ui";
import type { SupplierProfile } from "@/lib/supplier-profile/types";

export const dynamic = "force-dynamic";

async function loadProfile(orgId: string): Promise<SupplierProfile | null> {
  try {
    return await getProfileForOrg(orgId);
  } catch {
    return null;
  }
}

export default async function SupplierProfilePage() {
  const user = await getOptionalUser();
  const isSupplier =
    user?.role === "supplier_admin" || user?.role === "supplier_user";

  const profile =
    isSupplier && user ? await loadProfile(user.organization_id) : null;
  const canEdit = user?.role === "supplier_admin";
  const previewMode = !isSupplier;

  const status = profile?.approval_status ?? "draft";
  const { label, tone } = mapStatus(supplierStatusMap, status);

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Qualification"
        title="Company Profile"
        subtitle="Maintain your organization's manufacturing capability, compliance evidence, and review metadata."
        actions={<StatusBadge tone={tone}>{label}</StatusBadge>}
      />
      {previewMode && (
        <PreviewDataBanner reason="No supplier session — the form below is read-only and will not persist changes." />
      )}
      <Card>
        <SupplierProfileForm
          initial={profile}
          canEdit={!previewMode && canEdit}
        />
      </Card>
    </>
  );
}
