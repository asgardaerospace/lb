import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  getProgramById,
  getRfqById,
  listPartsForRfq,
} from "@/lib/rfq/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAsgardAdmin();
    const { id } = await params;
    const rfq = await getRfqById(id);
    if (!rfq) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [program, parts] = await Promise.all([
      getProgramById(rfq.program_id),
      listPartsForRfq(id),
    ]);
    return NextResponse.json({ rfq, program, parts });
  } catch (err) {
    return errorResponse(err);
  }
}
