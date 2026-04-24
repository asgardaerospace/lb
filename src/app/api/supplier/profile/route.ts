import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  getProfileForOrg,
  upsertDraft,
} from "@/lib/supplier-profile/repository";
import { EDITABLE_STATES } from "@/lib/supplier-profile/state";
import { profileDraftSchema } from "@/lib/supplier-profile/types";

export async function GET() {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const profile = await getProfileForOrg(user.organization_id);
    return NextResponse.json({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(["supplier_admin"]);

    const existing = await getProfileForOrg(user.organization_id);
    if (existing && !EDITABLE_STATES.includes(existing.approval_status)) {
      return NextResponse.json(
        {
          error: `Profile is ${existing.approval_status} and cannot be edited`,
        },
        { status: 409 },
      );
    }

    const body = await req.json();
    const draft = profileDraftSchema.parse(body);
    const profile = await upsertDraft(user.organization_id, user.id, draft);
    return NextResponse.json({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}
