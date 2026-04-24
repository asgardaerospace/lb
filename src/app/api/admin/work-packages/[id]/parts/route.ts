import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import {
  attachPart,
  getWorkPackageById,
} from "@/lib/routing/repository";
import { workPackagePartAttachSchema } from "@/lib/routing/types";
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
    const { part_id } = workPackagePartAttachSchema.parse(body);

    // Ensure the part belongs to the same RFQ as the work package.
    const supabase = await createServerSupabase();
    const { data: part, error } = await supabase
      .from("parts")
      .select("id, rfq_id")
      .eq("id", part_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }
    if ((part as { rfq_id: string }).rfq_id !== wp.rfq_id) {
      return NextResponse.json(
        { error: "Part does not belong to this RFQ" },
        { status: 409 },
      );
    }

    await attachPart(workPackageId, part_id, admin.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
