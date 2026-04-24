import { getOptionalUser } from "@/lib/auth";
import { listByStatus } from "@/lib/supplier-profile/repository";
import SupplierReviewRow from "./SupplierReviewRow";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  EmptyState,
  PreviewDataBanner,
  StatusBadge,
  Surface,
} from "@/components/ui";
import type { SupplierProfile } from "@/lib/supplier-profile/types";

export const dynamic = "force-dynamic";

async function loadProfiles(): Promise<SupplierProfile[] | null> {
  try {
    return await listByStatus(["submitted", "under_review"]);
  } catch {
    return null;
  }
}

export default async function AdminSupplierQueuePage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await loadProfiles() : null;
  const previewMode = !isAdmin || live === null;
  const profiles = live ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Supplier Qualification"
        title="Supplier Approval Queue"
        subtitle="Review certifications, capabilities, and compliance evidence before admitting suppliers into the routing pool."
      />

      {previewMode ? (
        <>
          <PreviewDataBanner reason="No asgard_admin session — showing an illustrative empty queue. Review actions are disabled until a real session is present." />
          <Surface>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Organization</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Submitted</th>
                    <th className="px-4 py-2.5">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="px-4 py-3 text-slate-200">
                      Aegis Dynamics (preview)
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone="info">Submitted</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      4/14/2026
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge tone="info" dot={false}>
                          AS9100
                        </StatusBadge>
                        <StatusBadge tone="info" dot={false}>
                          ITAR
                        </StatusBadge>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-200">
                      Lokis Forge (preview)
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone="accent">Under Review</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      4/12/2026
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge tone="info" dot={false}>
                          AS9100
                        </StatusBadge>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      ) : profiles.length === 0 ? (
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
