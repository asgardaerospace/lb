import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  getQuoteFor,
  insertQuote,
} from "@/lib/quotes/repository";
import { loadRequestForSupplier } from "@/lib/quotes/access";
import { quoteSubmitSchema } from "@/lib/quotes/types";

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

    const body = await req.json();
    const input = quoteSubmitSchema.parse(body);

    const quote = await insertQuote({
      work_package_id: rd.work_package_id,
      supplier_organization_id: user.organization_id,
      status: "submitted",
      quoted_price:
        typeof input.quoted_price === "number"
          ? String(input.quoted_price)
          : input.quoted_price ?? null,
      lead_time_days: input.lead_time_days ?? null,
      minimum_order_quantity: input.minimum_order_quantity ?? null,
      quote_notes: input.quote_notes ?? null,
      submitted_at: new Date().toISOString(),
      created_by: user.id,
    });

    await logAuditEvent({
      action: "quote.submitted",
      entity_type: "quote",
      entity_id: quote.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        routing_decision_id: rdId,
        work_package_id: rd.work_package_id,
        quoted_price: quote.quoted_price,
        lead_time_days: quote.lead_time_days,
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
