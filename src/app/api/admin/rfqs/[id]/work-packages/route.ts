import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { getRfqById } from "@/lib/rfq/repository";
import {
  createWorkPackage,
  getRfqStatus,
  listWorkPackagesForRfq,
  transitionRfqStatus,
} from "@/lib/routing/repository";
import { workPackageCreateSchema } from "@/lib/routing/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAsgardAdmin();
    const { id } = await params;
    const packages = await listWorkPackagesForRfq(id);
    return NextResponse.json({ work_packages: packages });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAsgardAdmin();
    const { id: rfqId } = await params;

    const rfq = await getRfqById(rfqId);
    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }
    const currentStatus = (await getRfqStatus(rfqId)) ?? rfq.status;
    if (
      currentStatus !== "submitted" &&
      currentStatus !== "routing_in_progress"
    ) {
      return NextResponse.json(
        {
          error: `RFQ status ${currentStatus} does not accept new work packages`,
        },
        { status: 409 },
      );
    }

    const body = await req.json();
    const input = workPackageCreateSchema.parse(body);
    const wp = await createWorkPackage(rfqId, admin.id, input);

    if (currentStatus === "submitted") {
      await transitionRfqStatus(rfqId, "routing_in_progress");
    }

    await logAuditEvent({
      action: "work_package.created",
      entity_type: "work_package",
      entity_id: wp.id,
      user_id: admin.id,
      organization_id: admin.organization_id,
      metadata: {
        rfq_id: rfqId,
        package_name: wp.package_name,
        rfq_status_after: "routing_in_progress",
      },
    });

    return NextResponse.json({ work_package: wp }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
