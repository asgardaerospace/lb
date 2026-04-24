import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAsgardAdmin();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("rfqs")
      .select(
        "id, program_id, rfq_title, priority, status, submitted_at, required_delivery_date",
      )
      .in("status", ["submitted", "routing_in_progress"])
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ rfqs: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}
