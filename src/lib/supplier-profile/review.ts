import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent, type AuditAction } from "@/lib/audit";
import {
  getProfileById,
  setStatus,
} from "@/lib/supplier-profile/repository";
import { canTransition } from "@/lib/supplier-profile/state";
import {
  reviewNoteSchema,
  type SupplierApprovalStatus,
} from "@/lib/supplier-profile/types";

interface Options {
  nextStatus: SupplierApprovalStatus;
  action: AuditAction;
}

export async function handleReviewAction(
  req: NextRequest,
  id: string,
  { nextStatus, action }: Options,
) {
  try {
    const admin = await requireAsgardAdmin();
    const profile = await getProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canTransition(profile.approval_status, nextStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition ${profile.approval_status} → ${nextStatus}`,
        },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { review_notes } = reviewNoteSchema.parse(body);

    const updated = await setStatus(profile.id, nextStatus, {
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes ?? null,
    });

    await logAuditEvent({
      action,
      entity_type: "supplier_profile",
      entity_id: updated.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        previous_status: profile.approval_status,
        supplier_organization_id: profile.organization_id,
        review_notes: review_notes ?? null,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
