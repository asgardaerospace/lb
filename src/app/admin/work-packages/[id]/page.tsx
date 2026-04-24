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
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, StatusBadge, WorkflowStepper } from "@/components/ui";

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
    <>
      <PageHeader
        eyebrow="Admin · Work Package"
        title={wp.package_name}
        subtitle={wp.package_type ?? undefined}
        actions={
          <StatusBadge tone={wp.status === "routed" ? "success" : "info"}>
            {wp.status}
          </StatusBadge>
        }
      />

      <div className="mb-6">
        <WorkflowStepper
          steps={[
            { key: "rfq", label: "RFQ" },
            { key: "routing", label: "Routing" },
            { key: "quote", label: "Quote" },
            { key: "job", label: "Job" },
          ]}
          currentKey={wp.status === "routed" ? "quote" : "routing"}
        />
      </div>

      <Card>
        <WorkPackageDetail
          workPackageId={wp.id}
          attachedParts={attachedParts}
          unattachedParts={unattachedParts}
          candidates={candidates}
          initialDecisions={decisions}
        />
      </Card>
    </>
  );
}
