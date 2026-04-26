import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { AuthError, requireRole } from "@/lib/auth";
import {
  deleteMachine,
  getMachine,
  updateMachine,
} from "@/lib/equipment/repository";
import { machineUpdateSchema } from "@/lib/equipment/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin"]);
    const { id } = await params;

    const machine = await getMachine(id);
    if (!machine) throw new AuthError("Not found", 404);
    if (machine.organization_id !== user.organization_id) {
      throw new AuthError("Forbidden", 403);
    }

    const patch = machineUpdateSchema.parse(await req.json());
    const updated = await updateMachine(id, patch);
    await logAuditEvent({
      action: "machine.updated",
      entity_type: "machine",
      entity_id: updated.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: { patch },
    });
    return NextResponse.json({ machine: updated });
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

    const machine = await getMachine(id);
    if (!machine) throw new AuthError("Not found", 404);
    if (machine.organization_id !== user.organization_id) {
      throw new AuthError("Forbidden", 403);
    }

    await deleteMachine(id);
    await logAuditEvent({
      action: "machine.deleted",
      entity_type: "machine",
      entity_id: id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        machine_type: machine.machine_type,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
