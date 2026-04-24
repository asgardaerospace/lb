import { AppShell } from "./AppShell";
import { adminNav, buyerNav, supplierNav } from "./nav-config";
import { getOptionalUser, type SessionUser } from "@/lib/auth";
import { PreviewModeBanner } from "./PreviewModeBanner";

type ShellRole = "admin" | "supplier" | "buyer";

function navFor(role: ShellRole) {
  return role === "admin" ? adminNav : role === "supplier" ? supplierNav : buyerNav;
}

function roleLabelFor(role: ShellRole, user: SessionUser | null) {
  if (role === "admin") return "Asgard Admin";
  if (role === "supplier")
    return user?.role === "supplier_admin"
      ? "Supplier — Admin"
      : user
        ? "Supplier Operator"
        : "Supplier (preview)";
  return user?.role === "buyer_admin"
    ? "Buyer — Admin"
    : user
      ? "Buyer Operator"
      : "Buyer (preview)";
}

export async function RoleShell({
  role,
  children,
}: {
  role: ShellRole;
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  return (
    <AppShell
      nav={navFor(role)}
      roleLabel={roleLabelFor(role, user)}
      userLabel={user ? user.email.split("@")[0] : "Preview"}
      userEmail={user?.email ?? "preview@launchbelt.local"}
    >
      {user ? null : <PreviewModeBanner />}
      {children}
    </AppShell>
  );
}
