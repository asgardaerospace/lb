import { notFound } from "next/navigation";
import { getOptionalUser, AuthError } from "@/lib/auth";
import { loadRfqForOrg } from "@/lib/rfq/access";
import {
  getProgramById,
  listPartsForRfq,
} from "@/lib/rfq/repository";
import RfqEditor from "./RfqEditor";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Card,
  RequiresLiveData,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  WorkflowStepper,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RfqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOptionalUser();
  const { id } = await params;
  const isBuyer = user?.role === "buyer_admin" || user?.role === "buyer_user";

  if (!isBuyer || !user) {
    return (
      <>
        <PageHeader
          eyebrow="Buyer · RFQ"
          title={id.slice(0, 8)}
          subtitle="RFQ detail requires an authenticated buyer session."
        />
        <RequiresLiveData
          reason="RFQ detail relies on live Supabase data scoped to your buyer organization."
          backHref="/buyer/rfqs"
          backLabel="Back to RFQs preview"
        />
      </>
    );
  }

  let rfq;
  try {
    rfq = await loadRfqForOrg(id, user.organization_id);
  } catch (err) {
    if (err instanceof AuthError && (err.status === 403 || err.status === 404)) {
      notFound();
    }
    return (
      <>
        <PageHeader eyebrow="Buyer · RFQ" title={id.slice(0, 8)} />
        <RequiresLiveData
          reason="Could not reach Supabase to load this RFQ."
          backHref="/buyer/rfqs"
          backLabel="Back to RFQs"
        />
      </>
    );
  }
  const [program, parts] = await Promise.all([
    getProgramById(rfq.program_id),
    listPartsForRfq(id),
  ]);

  const { label, tone } = mapStatus(rfqStatusMap, rfq.status);
  const currentStep =
    rfq.status === "draft"
      ? "rfq"
      : rfq.status === "submitted"
        ? "routing"
        : rfq.status === "routing_in_progress"
          ? "routing"
          : "quote";

  return (
    <>
      <PageHeader
        eyebrow={`Buyer · RFQ${program ? ` · ${program.program_name}` : ""}`}
        title={rfq.rfq_title}
        subtitle="Edit parts, attach drawings, and submit for routing."
        actions={
          <div className="flex gap-1.5">
            <StatusBadge tone={tone}>{label}</StatusBadge>
            <StatusBadge tone="info">{rfq.priority}</StatusBadge>
          </div>
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
          currentKey={currentStep}
        />
      </div>

      <Card>
        <RfqEditor rfq={rfq} initialParts={parts} />
      </Card>
    </>
  );
}
