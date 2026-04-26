import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { notifyRfqSubmitted } from "@/lib/notifications/dispatch";
import {
  listPartsForRfq,
  setRfqStatus,
} from "@/lib/rfq/repository";
import { loadRfqForOrg } from "@/lib/rfq/access";
import { canTransition } from "@/lib/rfq/state";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id } = await params;
    const rfq = await loadRfqForOrg(id, user.organization_id);

    if (!canTransition(rfq.status, "submitted")) {
      return NextResponse.json(
        { error: `Cannot submit from status ${rfq.status}` },
        { status: 409 },
      );
    }

    const parts = await listPartsForRfq(id);
    if (parts.length === 0) {
      return NextResponse.json(
        { error: "RFQ must have at least one part before submission" },
        { status: 409 },
      );
    }

    const updated = await setRfqStatus(id, "submitted", {
      submitted_at: new Date().toISOString(),
    });

    await logAuditEvent({
      action: "rfq.submitted",
      entity_type: "rfq",
      entity_id: updated.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        program_id: updated.program_id,
        part_count: parts.length,
        previous_status: rfq.status,
      },
    });

    await notifyRfqSubmitted({
      rfqId: updated.id,
      rfqTitle: updated.rfq_title,
      buyerOrgId: user.organization_id,
    });

    return NextResponse.json({ rfq: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
