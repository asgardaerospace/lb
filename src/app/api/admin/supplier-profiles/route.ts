import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listByStatus } from "@/lib/supplier-profile/repository";
import type { SupplierApprovalStatus } from "@/lib/supplier-profile/types";

const ALL_STATUSES: SupplierApprovalStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "revisions_requested",
];

export async function GET(req: NextRequest) {
  try {
    await requireAsgardAdmin();
    const statusParam = req.nextUrl.searchParams.get("status");
    const statuses: SupplierApprovalStatus[] = statusParam
      ? (statusParam
          .split(",")
          .filter((s): s is SupplierApprovalStatus =>
            (ALL_STATUSES as string[]).includes(s),
          ))
      : ["submitted", "under_review"];
    const profiles = await listByStatus(statuses);
    return NextResponse.json({ profiles });
  } catch (err) {
    return errorResponse(err);
  }
}
