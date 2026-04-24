import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listCandidateSuppliers } from "@/lib/routing/repository";

export async function GET() {
  try {
    await requireAsgardAdmin();
    const candidates = await listCandidateSuppliers();
    return NextResponse.json({ candidates });
  } catch (err) {
    return errorResponse(err);
  }
}
