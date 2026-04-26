import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { notifyQuoteRequested } from "@/lib/notifications/dispatch";
import { getRfqById } from "@/lib/rfq/repository";
import {
  getRoutingDecisionById,
  getWorkPackageById,
  markQuoteRequested,
  transitionRfqStatus,
  getRfqStatus,
} from "@/lib/routing/repository";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAsgardAdmin();
    const { id } = await params;

    const decision = await getRoutingDecisionById(id);
    if (!decision) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (decision.routing_status !== "pending") {
      return NextResponse.json(
        {
          error: `Cannot request quote from status ${decision.routing_status}`,
        },
        { status: 409 },
      );
    }

    const updated = await markQuoteRequested(id);

    // Side effect: move the RFQ to quotes_requested on first request.
    const wp = await getWorkPackageById(decision.work_package_id);
    if (wp) {
      const rfqStatus = await getRfqStatus(wp.rfq_id);
      if (rfqStatus === "routing_in_progress") {
        await transitionRfqStatus(wp.rfq_id, "quotes_requested");
      }
    }

    await logAuditEvent({
      action: "routing_decision.quote_requested",
      entity_type: "routing_decision",
      entity_id: updated.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        work_package_id: updated.work_package_id,
        supplier_organization_id: updated.supplier_organization_id,
      },
    });

    const rfq = wp ? await getRfqById(wp.rfq_id) : null;
    await notifyQuoteRequested({
      routingDecisionId: updated.id,
      workPackageId: updated.work_package_id,
      supplierOrgId: updated.supplier_organization_id,
      rfqTitle: rfq?.rfq_title ?? null,
    });

    return NextResponse.json({ routing_decision: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
