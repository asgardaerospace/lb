import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  InviteError,
  inviteCustomerAdmin,
} from "@/lib/customer-application/invite-repository";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email("Invalid email").max(320),
});

/**
 * POST /api/admin/customer-applications/[id]/invite
 *
 * Provisions a buyer_admin for the customer organization tied to a
 * converted application. Tries Supabase Auth admin invite; if email/auth
 * is not wired in this environment, records a placeholder audit entry
 * and returns placeholder_mode=true so the UI can surface a clear next-step.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(["asgard_admin"]);
    const { id: applicationId } = await ctx.params;

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "validation_failed",
          details: parsed.error.issues
            .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    }

    // Resolve the customer organization from the application's converted profile.
    const supabase = createServiceSupabase();
    const appRes = await supabase
      .from("customer_applications")
      .select("id, status, organization_id, converted_profile_id")
      .eq("id", applicationId)
      .maybeSingle();
    if (appRes.error) {
      return NextResponse.json(
        { error: "lookup_failed", message: appRes.error.message },
        { status: 500 },
      );
    }
    if (!appRes.data) {
      return NextResponse.json(
        { error: "not_found", message: "Application not found" },
        { status: 404 },
      );
    }
    const application = appRes.data as {
      id: string;
      status: string;
      organization_id: string | null;
      converted_profile_id: string | null;
    };
    if (application.status !== "converted" || !application.organization_id) {
      return NextResponse.json(
        {
          error: "not_converted",
          message:
            "Application must be converted before customers can be invited. Convert it first.",
        },
        { status: 409 },
      );
    }

    try {
      const result = await inviteCustomerAdmin({
        organizationId: application.organization_id,
        email: parsed.data.email.trim(),
        invitedBy: admin.id,
        invitedByOrganizationId: admin.organization_id,
      });
      return NextResponse.json({ invite: result }, { status: 200 });
    } catch (err) {
      if (err instanceof InviteError) {
        return NextResponse.json(
          { error: "invite_failed", message: err.message },
          { status: err.status },
        );
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    return errorResponse(err);
  }
}
