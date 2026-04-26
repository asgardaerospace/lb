import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { AuthError, requireRole } from "@/lib/auth";
import {
  deleteCapability,
  getCapability,
  updateCapability,
} from "@/lib/equipment/repository";
import { capabilityUpdateSchema } from "@/lib/equipment/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin"]);
    const { id } = await params;

    const capability = await getCapability(id);
    if (!capability) throw new AuthError("Not found", 404);
    if (capability.organization_id !== user.organization_id) {
      throw new AuthError("Forbidden", 403);
    }

    const patch = capabilityUpdateSchema.parse(await req.json());
    const updated = await updateCapability(id, patch);
    await logAuditEvent({
      action: "capability.updated",
      entity_type: "capability",
      entity_id: updated.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: { patch },
    });
    return NextResponse.json({ capability: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin"]);
    const { id } = await params;

    const capability = await getCapability(id);
    if (!capability) throw new AuthError("Not found", 404);
    if (capability.organization_id !== user.organization_id) {
      throw new AuthError("Forbidden", 403);
    }

    await deleteCapability(id);
    await logAuditEvent({
      action: "capability.deleted",
      entity_type: "capability",
      entity_id: id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: { process_type: capability.process_type },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
