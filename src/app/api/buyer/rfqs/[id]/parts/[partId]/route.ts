import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { deletePart, listPartsForRfq } from "@/lib/rfq/repository";
import { loadRfqForOrg } from "@/lib/rfq/access";
import { EDITABLE_STATES } from "@/lib/rfq/state";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; partId: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id: rfqId, partId } = await params;
    const rfq = await loadRfqForOrg(rfqId, user.organization_id);
    if (!EDITABLE_STATES.includes(rfq.status)) {
      return NextResponse.json(
        { error: `RFQ is ${rfq.status} and cannot be edited` },
        { status: 409 },
      );
    }
    const parts = await listPartsForRfq(rfqId);
    if (!parts.some((p) => p.id === partId)) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }
    await deletePart(partId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
