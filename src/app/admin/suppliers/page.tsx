import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listByStatus } from "@/lib/supplier-profile/repository";
import SupplierReviewRow from "./SupplierReviewRow";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState, Surface } from "@/components/ui";

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
    <>
      <PageHeader
        eyebrow="Admin · Supplier Qualification"
        title="Supplier Approval Queue"
        subtitle="Review certifications, capabilities, and compliance evidence before admitting suppliers into the routing pool."
      />

      {profiles.length === 0 ? (
        <EmptyState
          title="No profiles awaiting review"
          body="New supplier submissions will appear here as soon as they're submitted for review."
        />
      ) : (
        <Surface>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5">Organization</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Submitted</th>
                  <th className="px-4 py-2.5">Compliance</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {profiles.map((p) => (
                  <SupplierReviewRow key={p.id} profile={p} />
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </>
  );
}
