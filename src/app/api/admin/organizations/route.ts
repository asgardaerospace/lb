import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireAsgardAdmin } from "@/lib/auth";
import { listOrganizationsForDirectory } from "@/lib/organizations/repository";

export async function GET() {
  try {
    await requireAsgardAdmin();
    const organizations = await listOrganizationsForDirectory();
    return NextResponse.json({ organizations });
  } catch (err) {
    return errorResponse(err);
  }
}
