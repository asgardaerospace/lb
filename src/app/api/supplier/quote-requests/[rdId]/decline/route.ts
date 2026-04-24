import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  getQuoteFor,
  insertQuote,
} from "@/lib/quotes/repository";
import { loadRequestForSupplier } from "@/lib/quotes/access";
import { declineSchema } from "@/lib/quotes/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rdId: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const { rdId } = await params;
    const rd = await loadRequestForSupplier(rdId, user.organization_id);

    const existing = await getQuoteFor(rd.work_package_id, user.organization_id);
    if (existing) {
      return NextResponse.json(
        { error: `Quote already exists with status ${existing.status}` },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { quote_notes } = declineSchema.parse(body);

    const quote = await insertQuote({
      work_package_id: rd.work_package_id,
      supplier_organization_id: user.organization_id,
      status: "declined",
      quote_notes: quote_notes ?? null,
      created_by: user.id,
    });

    await logAuditEvent({
      action: "quote.declined",
      entity_type: "quote",
      entity_id: quote.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        routing_decision_id: rdId,
        work_package_id: rd.work_package_id,
        reason_note: quote_notes ?? null,
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
