import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  TransitionError,
  transitionCustomerApplication,
} from "@/lib/customer-application/repository";
import { REVIEW_ACTIONS } from "@/lib/customer-application/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(REVIEW_ACTIONS),
  notes: z.string().max(4000).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(["asgard_admin"]);
    const { id } = await ctx.params;
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

    try {
      const result = await transitionCustomerApplication(id, parsed.data.action, {
        reviewerId: admin.id,
        reviewerOrganizationId: admin.organization_id,
        notes: parsed.data.notes ?? null,
      });
      return NextResponse.json({ application: result }, { status: 200 });
    } catch (err) {
      if (err instanceof TransitionError) {
        return NextResponse.json(
          { error: "transition_invalid", message: err.message },
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
