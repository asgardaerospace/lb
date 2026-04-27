import { getOptionalUser } from "@/lib/auth";
import { RoleShell } from "@/components/shell/RoleShell";
import { recordCustomerActivationIfMissing } from "@/lib/customer-application/invite-repository";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Best-effort: when an invited buyer first hits any /buyer/* route,
  // record a `customer.activated` audit log entry. Idempotent — the
  // helper short-circuits if a prior log exists for this user, and
  // skips entirely for orgs that aren't converted-customer orgs.
  // Failures are swallowed inside the helper; this never blocks render.
  const user = await getOptionalUser();
  if (
    user &&
    (user.role === "buyer_admin" || user.role === "buyer_user") &&
    user.organization_id
  ) {
    await recordCustomerActivationIfMissing(user.id, user.organization_id);
  }

  return <RoleShell role="buyer">{children}</RoleShell>;
}
