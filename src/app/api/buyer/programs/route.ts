import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  createProgram,
  listProgramsForOrg,
} from "@/lib/rfq/repository";
import { programCreateSchema } from "@/lib/rfq/types";

export async function GET() {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const programs = await listProgramsForOrg(user.organization_id);
    return NextResponse.json({ programs });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const body = await req.json();
    const input = programCreateSchema.parse(body);
    const program = await createProgram(user.organization_id, user.id, input);

    await logAuditEvent({
      action: "program.created",
      entity_type: "program",
      entity_id: program.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        program_name: program.program_name,
        itar_controlled: program.itar_controlled,
        cui_controlled: program.cui_controlled,
      },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
