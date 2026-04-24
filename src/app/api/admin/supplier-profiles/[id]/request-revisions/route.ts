import { NextRequest } from "next/server";
import { handleReviewAction } from "@/lib/supplier-profile/review";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleReviewAction(req, id, {
    nextStatus: "revisions_requested",
    action: "supplier_profile.revisions_requested",
  });
}
