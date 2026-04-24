import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { getJobById, updateJob } from "@/lib/jobs/repository";
import { canSupplierTransition } from "@/lib/jobs/state";
import { sideEffectDates } from "@/lib/jobs/transitions";
import { statusUpdateSchema } from "@/lib/jobs/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const { id } = await params;

    const job = await getJobById(id);
    if (!job || job.supplier_organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, note } = statusUpdateSchema.parse(body);

    if (!canSupplierTransition(job.status, status)) {
      return NextResponse.json(
        {
          error: `Supplier cannot transition ${job.status} → ${status}`,
        },
        { status: 409 },
      );
    }

    const patch = sideEffectDates(status, {
      start_date: job.start_date,
      completed_date: job.completed_date,
    });
    const updated = await updateJob(id, { status, ...patch });

    await logAuditEvent({
      action: "job.status_updated",
      entity_type: "job",
      entity_id: updated.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        previous_status: job.status,
        next_status: status,
        start_date: updated.start_date,
        completed_date: updated.completed_date,
        note: note ?? null,
      },
    });

    return NextResponse.json({ job: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
