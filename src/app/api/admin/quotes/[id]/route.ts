import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getQuoteById } from "@/lib/quotes/repository";
import {
  getWorkPackageById,
  listPartsForWorkPackage,
} from "@/lib/routing/repository";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAsgardAdmin();
    const { id } = await params;
    const quote = await getQuoteById(id);
    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [wp, parts, orgRow] = await Promise.all([
      getWorkPackageById(quote.work_package_id),
      listPartsForWorkPackage(quote.work_package_id),
      (async () => {
        const supabase = await createServerSupabase();
        const { data } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", quote.supplier_organization_id)
          .maybeSingle();
        return data as { id: string; name: string } | null;
      })(),
    ]);
    return NextResponse.json({
      quote,
      work_package: wp,
      parts,
      supplier_organization: orgRow,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
