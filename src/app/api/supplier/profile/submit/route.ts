import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  getProfileForOrg,
  setStatus,
} from "@/lib/supplier-profile/repository";
import { canTransition } from "@/lib/supplier-profile/state";

export async function POST() {
  try {
    const user = await requireRole(["supplier_admin"]);
    const profile = await getProfileForOrg(user.organization_id);
    if (!profile) {
      return NextResponse.json(
        { error: "No profile to submit" },
        { status: 404 },
      );
    }
    if (!canTransition(profile.approval_status, "submitted")) {
      return NextResponse.json(
        {
          error: `Cannot submit from status ${profile.approval_status}`,
        },
        { status: 409 },
      );
    }

    const updated = await setStatus(profile.id, "submitted", {
      submitted_at: new Date().toISOString(),
    });

    await logAuditEvent({
      action: "supplier_profile.submitted",
      entity_type: "supplier_profile",
      entity_id: updated.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: { previous_status: profile.approval_status },
    });

    return NextResponse.json({ profile: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
