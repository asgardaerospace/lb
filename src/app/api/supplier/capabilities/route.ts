import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import {
  createCapability,
  listCapabilities,
} from "@/lib/equipment/repository";
import { capabilityCreateSchema } from "@/lib/equipment/types";

export async function GET() {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const capabilities = await listCapabilities(user.organization_id);
    return NextResponse.json({ capabilities });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["supplier_admin"]);
    const body = await req.json();
    const input = capabilityCreateSchema.parse(body);
    const capability = await createCapability(
      user.organization_id,
      user.id,
      input,
    );
    await logAuditEvent({
      action: "capability.created",
      entity_type: "capability",
      entity_id: capability.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        process_type: capability.process_type,
        materials: capability.materials_supported,
      },
    });
    return NextResponse.json({ capability }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
