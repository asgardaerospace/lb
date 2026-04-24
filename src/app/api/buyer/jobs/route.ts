import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listJobsForBuyer } from "@/lib/jobs/repository";

export async function GET() {
  try {
    const user = await requireRole(["buyer_admin", "buyer_user"]);
    const jobs = await listJobsForBuyer(user.organization_id);
    return NextResponse.json({ jobs });
  } catch (err) {
    return errorResponse(err);
  }
}
