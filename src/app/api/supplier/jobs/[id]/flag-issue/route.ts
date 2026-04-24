import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { getJobById, updateJob } from "@/lib/jobs/repository";
import { issueFlagSchema } from "@/lib/jobs/types";

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
    const { note } = issueFlagSchema.parse(body);

    const now = new Date().toISOString();
    const updated = await updateJob(id, {
      last_issue_note: note,
      last_issue_flagged_at: now,
    });

    await logAuditEvent({
      action: "job.issue_flagged",
      entity_type: "job",
      entity_id: updated.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        flagged_by_role: user.role,
        job_status: updated.status,
        note,
      },
    });

    return NextResponse.json({ job: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
