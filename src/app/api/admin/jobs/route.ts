import { NextResponse } from "next/server";
import { requireAsgardAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { listAllJobs } from "@/lib/jobs/repository";

export async function GET() {
  try {
    await requireAsgardAdmin();
    const jobs = await listAllJobs();
    return NextResponse.json({ jobs });
  } catch (err) {
    return errorResponse(err);
  }
}
