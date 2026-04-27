import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  ConversionError,
  convertCustomerApplication,
  getMaterializedBundleForApplication,
} from "@/lib/customer-application/conversion-repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customer-applications/[id]/convert
 *
 * Calls the SECURITY DEFINER `convert_customer_application(application_id,
 * admin_user_id)` SQL function. Materializes:
 *   - organizations row (if anonymous intake)
 *   - customer_profiles row
 *   - customer_routing_weights row
 *   - customer_supplier_filters row
 *   - audit_logs entry
 *   - flips customer_applications.status to 'converted'
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
      result = await convertCustomerApplication(id, admin.id);
    } catch (err) {
      if (err instanceof ConversionError) {
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

    // Re-read the materialized bundle so the client gets the canonical
    // view (in case schema-level defaults filled in any column).
    const bundle = await getMaterializedBundleForApplication(id).catch(() => null);

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
