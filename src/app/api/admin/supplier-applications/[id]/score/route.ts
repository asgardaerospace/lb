import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { computeAndStoreSupplierFitScore } from "@/lib/supplier-application/scoring-repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/supplier-applications/[id]/score
 *
 * Generates or refreshes a supplier_readiness_scores row for the
 * application using the v2 scoring model. Idempotent — re-running
 * UPSERTs the row and emits a new audit_logs entry.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(["asgard_admin"]);
    const { id } = await ctx.params;
    const score = await computeAndStoreSupplierFitScore(id, {
      computedBy: admin.id,
    });
    return NextResponse.json({ score }, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    return errorResponse(err);
  }
}
