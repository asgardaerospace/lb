import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { createMachine, listMachines } from "@/lib/equipment/repository";
import { machineCreateSchema } from "@/lib/equipment/types";

export async function GET() {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const machines = await listMachines(user.organization_id);
    return NextResponse.json({ machines });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["supplier_admin"]);
    const body = await req.json();
    const input = machineCreateSchema.parse(body);
    const machine = await createMachine(user.organization_id, user.id, input);
    await logAuditEvent({
      action: "machine.created",
      entity_type: "machine",
      entity_id: machine.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        machine_type: machine.machine_type,
        materials: machine.materials_supported,
        capacity: machine.capacity,
      },
    });
    return NextResponse.json({ machine }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
