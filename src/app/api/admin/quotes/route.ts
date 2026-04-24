import { NextRequest, NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listQuotesByStatus } from "@/lib/quotes/repository";
import type { QuoteStatus } from "@/lib/quotes/types";

const ALL: QuoteStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "declined",
];

export async function GET(req: NextRequest) {
  try {
    await requireAsgardAdmin();
    const param = req.nextUrl.searchParams.get("status");
    const statuses: QuoteStatus[] = param
      ? param
          .split(",")
          .filter((s): s is QuoteStatus => (ALL as string[]).includes(s))
      : ["submitted", "under_review"];
    const quotes = await listQuotesByStatus(statuses);
    return NextResponse.json({ quotes });
  } catch (err) {
    return errorResponse(err);
  }
}
