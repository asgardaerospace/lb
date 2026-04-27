import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  SupplierConversionError,
  convertSupplierApplication,
  getMaterializedSupplierBundleForApplication,
} from "@/lib/supplier-application/conversion-repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/supplier-applications/[id]/convert
 *
 * Calls the SECURITY DEFINER `convert_supplier_application(application_id,
 * admin_user_id)` SQL function. Materializes:
 *   - organizations row (if anonymous intake)
 *   - supplier_profiles row
 *   - certifications, machines, capabilities child rows
 *   - audit_logs entry
 *   - flips supplier_applications.status to 'converted'
 *
 * Returns the conversion result + the freshly materialized bundle so the
 * detail page can render the post-conversion summary without a refetch.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(["asgard_admin"]);
    const { id } = await ctx.params;

    let result;
    try {
      result = await convertSupplierApplication(id, admin.id);
    } catch (err) {
      if (err instanceof SupplierConversionError) {
        return NextResponse.json(
          {
            error: "conversion_failed",
            message: err.message,
            code: err.code ?? null,
          },
          { status: err.status },
        );
      }
      throw err;
    }

    const bundle = await getMaterializedSupplierBundleForApplication(id).catch(
      () => null,
    );

    return NextResponse.json(
      {
        conversion: result,
        bundle,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    return errorResponse(err);
  }
}
