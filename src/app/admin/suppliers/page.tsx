import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listByStatus } from "@/lib/supplier-profile/repository";
import SupplierReviewRow from "./SupplierReviewRow";

export const dynamic = "force-dynamic";

export default async function AdminSupplierQueuePage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const profiles = await listByStatus(["submitted", "under_review"]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Supplier Approval Queue</h1>
      {profiles.length === 0 ? (
        <p className="text-sm text-gray-600">No profiles awaiting review.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-2">Organization</th>
              <th className="py-2">Status</th>
              <th className="py-2">Submitted</th>
              <th className="py-2">Compliance</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <SupplierReviewRow key={p.id} profile={p} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
