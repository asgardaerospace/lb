import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  listPartsForRfq,
  updateRfqDraft,
} from "@/lib/rfq/repository";
import { loadRfqForOrg } from "@/lib/rfq/access";
import { EDITABLE_STATES } from "@/lib/rfq/state";
import { rfqUpdateSchema } from "@/lib/rfq/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id } = await params;
    const rfq = await loadRfqForOrg(id, user.organization_id);
    const parts = await listPartsForRfq(id);
    return NextResponse.json({ rfq, parts });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id } = await params;
    const rfq = await loadRfqForOrg(id, user.organization_id);
    if (!EDITABLE_STATES.includes(rfq.status)) {
      return NextResponse.json(
        { error: `RFQ is ${rfq.status} and cannot be edited` },
        { status: 409 },
      );
    }
    const body = await req.json();
    const patch = rfqUpdateSchema.parse(body);
    const updated = await updateRfqDraft(id, patch);
    return NextResponse.json({ rfq: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
