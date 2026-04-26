import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { countUnread, listForUser } from "@/lib/notifications/repository";

export async function GET() {
  try {
    const user = await requireUser();
    const [notifications, unread] = await Promise.all([
      listForUser(user.id, 30),
      countUnread(user.id),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (err) {
    return errorResponse(err);
  }
}
