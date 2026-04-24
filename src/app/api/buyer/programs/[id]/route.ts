import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  getProgramById,
  listRfqsForProgram,
} from "@/lib/rfq/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const { id } = await params;
    const program = await getProgramById(id);
    if (!program) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (program.buyer_organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const rfqs = await listRfqsForProgram(id);
    return NextResponse.json({ program, rfqs });
  } catch (err) {
    return errorResponse(err);
  }
}
