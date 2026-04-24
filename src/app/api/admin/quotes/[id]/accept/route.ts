import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  getQuoteById,
  insertJob,
  setQuoteStatus,
} from "@/lib/quotes/repository";
import { canTransition } from "@/lib/quotes/state";
import { reviewNoteSchema } from "@/lib/quotes/types";
import { getWorkPackageById } from "@/lib/routing/repository";
import { createServerSupabase } from "@/lib/supabase/server";

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
    if (!canTransition(quote.status, "accepted")) {
      return NextResponse.json(
        { error: `Cannot accept from status ${quote.status}` },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { review_notes } = reviewNoteSchema.parse(body);

    // Look up rfq.required_delivery_date so the job can inherit a due date.
    const wp = await getWorkPackageById(quote.work_package_id);
    let due_date: string | null = null;
    if (wp) {
      const supabase = await createServerSupabase();
      const { data: rfq } = await supabase
        .from("rfqs")
        .select("required_delivery_date")
        .eq("id", wp.rfq_id)
        .maybeSingle();
      due_date =
        (rfq as { required_delivery_date: string | null } | null)
          ?.required_delivery_date ?? null;
    }

    const updated = await setQuoteStatus(id, "accepted", {
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes ?? null,
    });

    const job = await insertJob({
      work_package_id: quote.work_package_id,
      supplier_organization_id: quote.supplier_organization_id,
      quote_id: quote.id,
      due_date,
      created_by: admin.id,
    });

    await logAuditEvent({
      action: "quote.accepted",
      entity_type: "quote",
      entity_id: updated.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        work_package_id: updated.work_package_id,
        supplier_organization_id: updated.supplier_organization_id,
        previous_status: quote.status,
        job_id: job.id,
        review_notes: review_notes ?? null,
      },
    });

    await logAuditEvent({
      action: "job.created",
      entity_type: "job",
      entity_id: job.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        quote_id: updated.id,
        work_package_id: job.work_package_id,
        supplier_organization_id: job.supplier_organization_id,
        due_date: job.due_date,
      },
    });

    return NextResponse.json({ quote: updated, job });
  } catch (err) {
    return errorResponse(err);
  }
}
