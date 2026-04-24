import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getQuoteFor } from "@/lib/quotes/repository";
import { loadRequestForSupplier } from "@/lib/quotes/access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ rdId: string }> },
) {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const { rdId } = await params;
    const rd = await loadRequestForSupplier(rdId, user.organization_id);
    const quote = await getQuoteFor(rd.work_package_id, user.organization_id);
    return NextResponse.json({ quote });
  } catch (err) {
    return errorResponse(err);
  }
}
