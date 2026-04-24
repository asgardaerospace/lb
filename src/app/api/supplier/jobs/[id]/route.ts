import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getJobById } from "@/lib/jobs/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const { id } = await params;
    const job = await getJobById(id);
    if (!job || job.supplier_organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    return errorResponse(err);
  }
}
