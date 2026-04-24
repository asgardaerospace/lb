import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listPartsForRfq } from "@/lib/rfq/repository";
import {
  getWorkPackageById,
  listCandidateSuppliers,
  listPartsForWorkPackage,
  listRoutingDecisionsForWorkPackage,
} from "@/lib/routing/repository";
import WorkPackageDetail from "./WorkPackageDetail";

export const dynamic = "force-dynamic";

export default async function WorkPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const { id } = await params;
  const wp = await getWorkPackageById(id);
  if (!wp) notFound();

  const [attachedParts, rfqParts, candidates, decisions] = await Promise.all([
    listPartsForWorkPackage(id),
    listPartsForRfq(wp.rfq_id),
    listCandidateSuppliers(),
    listRoutingDecisionsForWorkPackage(id),
  ]);

  const attachedIds = new Set(attachedParts.map((p) => p.id));
  const unattachedParts = rfqParts.filter((p) => !attachedIds.has(p.id));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link
        href={`/admin/routing/rfqs/${wp.rfq_id}`}
        className="text-sm text-gray-500 underline"
      >
        ← RFQ routing
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{wp.package_name}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {wp.package_type ?? "—"} · status {wp.status}
      </p>
      <WorkPackageDetail
        workPackageId={wp.id}
        attachedParts={attachedParts}
        unattachedParts={unattachedParts}
        candidates={candidates}
        initialDecisions={decisions}
      />
    </main>
  );
}
