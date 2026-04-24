import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  createRfq,
  getProgramById,
} from "@/lib/rfq/repository";
import { rfqCreateSchema } from "@/lib/rfq/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id: programId } = await params;

    const program = await getProgramById(programId);
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    if (program.buyer_organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const input = rfqCreateSchema.parse(body);
    const rfq = await createRfq(programId, user.id, input);

    await logAuditEvent({
      action: "rfq.created",
      entity_type: "rfq",
      entity_id: rfq.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        program_id: programId,
        rfq_title: rfq.rfq_title,
      },
    });

    return NextResponse.json({ rfq }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
