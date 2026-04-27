import { getOptionalUser } from "@/lib/auth";
import { RoleShell } from "@/components/shell/RoleShell";
import { recordSupplierActivationIfMissing } from "@/lib/supplier-application/invite-repository";

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Best-effort: when an invited supplier first hits any /supplier/* route,
  // record a `supplier.activated` audit log entry. Idempotent — the helper
  // short-circuits if a prior log exists for this user, and skips entirely
  // for orgs that aren't converted-supplier orgs (no source_application_id
  // on supplier_profiles). Failures are swallowed inside the helper.
  const user = await getOptionalUser();
  if (
    user &&
    (user.role === "supplier_admin" || user.role === "supplier_user") &&
    user.organization_id
  ) {
    await recordSupplierActivationIfMissing(user.id, user.organization_id);
  }

  return <RoleShell role="supplier">{children}</RoleShell>;
}
