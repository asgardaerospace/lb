import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { getQuoteById, setQuoteStatus } from "@/lib/quotes/repository";
import { canTransition } from "@/lib/quotes/state";
import { reviewNoteSchema } from "@/lib/quotes/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAsgardAdmin();
    const { id } = await params;

    const quote = await getQuoteById(id);
    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canTransition(quote.status, "rejected")) {
      return NextResponse.json(
        { error: `Cannot reject from status ${quote.status}` },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { review_notes } = reviewNoteSchema.parse(body);

    const updated = await setQuoteStatus(id, "rejected", {
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes ?? null,
    });

    await logAuditEvent({
      action: "quote.rejected",
      entity_type: "quote",
      entity_id: updated.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        work_package_id: updated.work_package_id,
        supplier_organization_id: updated.supplier_organization_id,
        previous_status: quote.status,
        review_notes: review_notes ?? null,
      },
    });

    return NextResponse.json({ quote: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
