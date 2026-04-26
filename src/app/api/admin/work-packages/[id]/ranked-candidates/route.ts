import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireAsgardAdmin } from "@/lib/auth";
import { rankCandidatesForWorkPackage } from "@/lib/routing/rank";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAsgardAdmin();
    const { id } = await params;
    const ranked = await rankCandidatesForWorkPackage(id);
    return NextResponse.json({ candidates: ranked });
  } catch (err) {
    return errorResponse(err);
  }
}
