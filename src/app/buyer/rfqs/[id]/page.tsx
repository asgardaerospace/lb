import { notFound } from "next/navigation";
import { getOptionalUser, AuthError } from "@/lib/auth";
import { loadRfqForOrg } from "@/lib/rfq/access";
import {
  getProgramById,
  listPartsForRfq,
} from "@/lib/rfq/repository";
import RfqEditor from "./RfqEditor";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  DocumentsSection,
  NextStep,
  RequiresLiveData,
  StatusBadge,
  mapStatus,
  rfqStatusMap,
  WorkflowStepper,
} from "@/components/ui";
import { loadDocumentsForPage } from "@/lib/documents/load";

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
  const [program, parts, docs] = await Promise.all([
    getProgramById(rfq.program_id),
    listPartsForRfq(id),
    loadDocumentsForPage("rfq", id),
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
        back={{
          href: program ? `/buyer/programs/${program.id}` : "/buyer/rfqs",
          label: program ? program.program_name : "All RFQs",
        }}
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

      {(() => {
        const status = rfq.status as string;
        if (status === "draft") {
          return (
            <NextStep
              tone="info"
              title="Add parts and submit for routing"
              body={
                parts.length === 0
                  ? "Add at least one part below before this RFQ can be submitted to Asgard for supplier routing."
                  : "Review the parts below and submit when ready. Once submitted, Asgard operators will route to qualified suppliers."
              }
            />
          );
        }
        if (status === "submitted") {
          return (
            <NextStep
              tone="warn"
              title="Awaiting Asgard routing"
              body="Your RFQ is in the routing queue. You'll be notified as soon as supplier quotes come in."
              cta={{ href: "/buyer/jobs", label: "View jobs" }}
            />
          );
        }
        if (status === "routing_in_progress" || status === "quotes_requested") {
          return (
            <NextStep
              tone="warn"
              title="Quotes in flight"
              body="Asgard has routed this RFQ. Suppliers are preparing quotes — review will follow."
              cta={{ href: "/buyer/jobs", label: "View jobs" }}
            />
          );
        }
        if (status === "awarded") {
          return (
            <NextStep
              tone="success"
              title="Awarded — track production"
              body="A quote was accepted and a job is now in production."
              cta={{ href: "/buyer/jobs", label: "Open jobs" }}
            />
          );
        }
        return null;
      })()}

      <Card>
        <RfqEditor rfq={rfq} initialParts={parts} />
      </Card>

      <div className="mt-6">
        <SectionHeader
          title="RFQ documents"
          subtitle="Attach CAD, drawings, and specifications visible to Asgard ops and routed suppliers."
        />
        <Card>
          <DocumentsSection
            entityType="rfq"
            entityId={rfq.id}
            canUpload={rfq.status === "draft"}
            storageReady={docs.storageReady}
            initialDocuments={docs.documents}
            emptyHint="No CAD, drawings, or specifications attached yet."
          />
        </Card>
      </div>
    </>
  );
}
