import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listSupplierInbox } from "@/lib/quotes/repository";

export async function GET() {
  try {
    const user = await requireRole(["supplier_admin", "supplier_user"]);
    const inbox = await listSupplierInbox(user.organization_id);
    return NextResponse.json({ inbox });
  } catch (err) {
    return errorResponse(err);
  }
}
