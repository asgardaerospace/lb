import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  getWorkPackageById,
  listPartsForWorkPackage,
  listRoutingDecisionsForWorkPackage,
} from "@/lib/routing/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAsgardAdmin();
    const { id } = await params;
    const wp = await getWorkPackageById(id);
    if (!wp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [parts, routing_decisions] = await Promise.all([
      listPartsForWorkPackage(id),
      listRoutingDecisionsForWorkPackage(id),
    ]);
    return NextResponse.json({
      work_package: wp,
      parts,
      routing_decisions,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
