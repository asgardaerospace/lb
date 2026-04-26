import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { authorizeDocumentEntity } from "@/lib/documents/access";
import { listDocumentsForEntity } from "@/lib/documents/repository";
import {
  DOCUMENT_ENTITY_TYPES,
  type DocumentEntityType,
} from "@/lib/documents/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const entityType = url.searchParams.get("entity_type");
    const entityId = url.searchParams.get("entity_id");

    if (
      !entityType ||
      !DOCUMENT_ENTITY_TYPES.includes(entityType as DocumentEntityType) ||
      !entityId
    ) {
      return NextResponse.json(
        { error: "entity_type and entity_id required" },
        { status: 400 },
      );
    }

    await authorizeDocumentEntity(
      user,
      entityType as DocumentEntityType,
      entityId,
      "read",
    );

    const documents = await listDocumentsForEntity(
      entityType as DocumentEntityType,
      entityId,
    );
    return NextResponse.json({ documents });
  } catch (err) {
    return errorResponse(err);
  }
}
