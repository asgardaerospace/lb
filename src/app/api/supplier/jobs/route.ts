import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listJobsForSupplier } from "@/lib/jobs/repository";

export async function GET() {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const jobs = await listJobsForSupplier(user.organization_id);
    return NextResponse.json({ jobs });
  } catch (err) {
    return errorResponse(err);
  }
}
