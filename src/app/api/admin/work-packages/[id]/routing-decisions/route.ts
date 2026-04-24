import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import {
  createRoutingDecision,
  getWorkPackageById,
} from "@/lib/routing/repository";
import { routingDecisionCreateSchema } from "@/lib/routing/types";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAsgardAdmin();
    const { id: workPackageId } = await params;

    const wp = await getWorkPackageById(workPackageId);
    if (!wp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const input = routingDecisionCreateSchema.parse(body);

    // Verify the supplier org exists and is an approved supplier.
    const supabase = await createServerSupabase();
    const { data: prof, error } = await supabase
      .from("supplier_profiles")
      .select("approval_status, organization_id")
      .eq("organization_id", input.supplier_organization_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prof) {
      return NextResponse.json(
        { error: "Supplier has no profile" },
        { status: 404 },
      );
    }
    if ((prof as { approval_status: string }).approval_status !== "approved") {
      return NextResponse.json(
        { error: "Supplier is not approved" },
        { status: 409 },
      );
    }

    const decision = await createRoutingDecision(workPackageId, admin.id, input);

    await logAuditEvent({
      action: "routing_decision.created",
      entity_type: "routing_decision",
      entity_id: decision.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        work_package_id: workPackageId,
        supplier_organization_id: decision.supplier_organization_id,
        fit_scores: {
          capability: decision.capability_fit_score,
          capacity: decision.capacity_fit_score,
          compliance: decision.compliance_fit_score,
          schedule: decision.schedule_fit_score,
        },
      },
    });

    return NextResponse.json(
      { routing_decision: decision },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
