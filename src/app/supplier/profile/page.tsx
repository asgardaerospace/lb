import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { getProfileForOrg } from "@/lib/supplier-profile/repository";
import SupplierProfileForm from "./SupplierProfileForm";

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

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold">Supplier Profile</h1>
      <p className="mb-6 text-sm text-gray-600">
        Status:{" "}
        <span className="font-mono">
          {profile?.approval_status ?? "draft"}
        </span>
      </p>
      <SupplierProfileForm initial={profile} canEdit={canEdit} />
    </main>
  );
}
