import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { createPart } from "@/lib/rfq/repository";
import { loadRfqForOrg } from "@/lib/rfq/access";
import { EDITABLE_STATES } from "@/lib/rfq/state";
import { partUpsertSchema } from "@/lib/rfq/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id: rfqId } = await params;
    const rfq = await loadRfqForOrg(rfqId, user.organization_id);
    if (!EDITABLE_STATES.includes(rfq.status)) {
      return NextResponse.json(
        { error: `RFQ is ${rfq.status} and cannot be edited` },
        { status: 409 },
      );
    }
    const body = await req.json();
    const input = partUpsertSchema.parse(body);
    const part = await createPart(rfqId, user.id, input);
    return NextResponse.json({ part }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
