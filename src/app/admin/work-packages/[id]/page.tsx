import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { listPartsForRfq } from "@/lib/rfq/repository";
import {
  getWorkPackageById,
  listPartsForWorkPackage,
  listRoutingDecisionsForWorkPackage,
} from "@/lib/routing/repository";
import { rankCandidatesForWorkPackage } from "@/lib/routing/rank";
import WorkPackageDetail from "./WorkPackageDetail";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Card,
  RequiresLiveData,
  StatusBadge,
  WorkflowStepper,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WorkPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOptionalUser();
  const { id } = await params;

  if (user?.role !== "asgard_admin") {
    return (
      <>
        <PageHeader
          eyebrow="Admin · Work Package"
          title={id.slice(0, 8)}
          subtitle="Work package detail requires an authenticated asgard_admin session."
        />
        <RequiresLiveData
          reason="Work package routing relies on live Supabase data and the asgard_admin role."
          backHref="/admin/routing"
          backLabel="Back to Routing Queue preview"
        />
      </>
    );
  }

  let wp: Awaited<ReturnType<typeof getWorkPackageById>> | null = null;
  try {
    wp = await getWorkPackageById(id);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Admin · Work Package" title={id.slice(0, 8)} />
        <RequiresLiveData
          reason="Could not reach Supabase to load this work package."
          backHref="/admin/routing"
          backLabel="Back to Routing Queue"
        />
      </>
    );
  }
  if (!wp) notFound();

  const [attachedParts, rfqParts, rankedCandidates, decisions] = await Promise.all([
    listPartsForWorkPackage(id),
    listPartsForRfq(wp.rfq_id),
    rankCandidatesForWorkPackage(id),
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
        back={{ href: `/admin/routing/rfqs/${wp.rfq_id}`, label: "Back to RFQ" }}
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
          rankedCandidates={rankedCandidates}
          initialDecisions={decisions}
        />
      </Card>
    </>
  );
}
