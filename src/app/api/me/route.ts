import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
