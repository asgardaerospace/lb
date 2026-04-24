import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listQuoteRequestsForSupplier } from "@/lib/routing/repository";

export async function GET() {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const requests = await listQuoteRequestsForSupplier(user.organization_id);
    return NextResponse.json({ quote_requests: requests });
  } catch (err) {
    return errorResponse(err);
  }
}
