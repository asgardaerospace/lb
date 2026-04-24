import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { detachPart } from "@/lib/routing/repository";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; partId: string }> },
) {
  try {
    await requireAsgardAdmin();
    const { id: workPackageId, partId } = await params;
    await detachPart(workPackageId, partId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
