import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listRfqsForOrg } from "@/lib/rfq/repository";

export async function GET() {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const rfqs = await listRfqsForOrg(user.organization_id);
    return NextResponse.json({ rfqs });
  } catch (err) {
    return errorResponse(err);
  }
}
