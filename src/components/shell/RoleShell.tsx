import { AppShell } from "./AppShell";
import { adminNav, buyerNav, supplierNav } from "./nav-config";
import { requireUser, type SessionUser, AuthError } from "@/lib/auth";
import { redirect } from "next/navigation";

type ShellRole = "admin" | "supplier" | "buyer";

async function resolveUser(): Promise<SessionUser | null> {
  try {
    return await requireUser();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) return null;
    throw err;
  }
}

function navFor(role: ShellRole) {
  return role === "admin" ? adminNav : role === "supplier" ? supplierNav : buyerNav;
}

function roleLabelFor(role: ShellRole, user: SessionUser | null) {
  if (role === "admin") return "Asgard Admin";
  if (role === "supplier")
    return user?.role === "supplier_admin"
      ? "Supplier — Admin"
      : "Supplier Operator";
  return user?.role === "buyer_admin" ? "Buyer — Admin" : "Buyer Operator";
}

export async function RoleShell({
  role,
  children,
}: {
  role: ShellRole;
  children: React.ReactNode;
}) {
  const user = await resolveUser();
  if (!user) {
    redirect("/");
  }

  return (
    <AppShell
      nav={navFor(role)}
      roleLabel={roleLabelFor(role, user)}
      userLabel={user.email.split("@")[0]}
      userEmail={user.email}
    >
      {children}
    </AppShell>
  );
}

export async function DevPreviewShell({
  role,
  children,
}: {
  role: ShellRole;
  children: React.ReactNode;
}) {
  const user = await resolveUser();
  return (
    <AppShell
      nav={navFor(role)}
      roleLabel={roleLabelFor(role, user)}
      userLabel={user ? user.email.split("@")[0] : "Preview"}
      userEmail={user?.email ?? "preview@launchbelt.local"}
    >
      {children}
    </AppShell>
  );
}
