import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listRfqsByStatus } from "@/lib/rfq/repository";
import type { RfqStatus } from "@/lib/rfq/types";

const ALL: RfqStatus[] = ["draft", "submitted"];

export async function GET(req: NextRequest) {
  try {
    await requireAsgardAdmin();
    const statusParam = req.nextUrl.searchParams.get("status");
    const statuses: RfqStatus[] = statusParam
      ? statusParam
          .split(",")
          .filter((s): s is RfqStatus => (ALL as string[]).includes(s))
      : ["submitted"];
    const rfqs = await listRfqsByStatus(statuses);
    return NextResponse.json({ rfqs });
  } catch (err) {
    return errorResponse(err);
  }
}
