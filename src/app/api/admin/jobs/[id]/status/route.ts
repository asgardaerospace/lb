import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { getJobById, updateJob } from "@/lib/jobs/repository";
import { sideEffectDates } from "@/lib/jobs/transitions";
import { statusUpdateSchema } from "@/lib/jobs/types";

// Admin override — any-to-any transition permitted. Logged distinctly from
// supplier-driven updates so audit review can spot overrides at a glance.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAsgardAdmin();
    const { id } = await params;

    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, note } = statusUpdateSchema.parse(body);

    if (status === job.status) {
      return NextResponse.json(
        { error: "Status unchanged" },
        { status: 409 },
      );
    }

    const patch = sideEffectDates(status, {
      start_date: job.start_date,
      completed_date: job.completed_date,
    });
    const updated = await updateJob(id, { status, ...patch });

    await logAuditEvent({
      action: "job.status_overridden",
      entity_type: "job",
      entity_id: updated.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        previous_status: job.status,
        next_status: status,
        supplier_organization_id: updated.supplier_organization_id,
        note: note ?? null,
      },
    });

    return NextResponse.json({ job: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
