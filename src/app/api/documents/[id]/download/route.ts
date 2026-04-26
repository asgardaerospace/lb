import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { AuthError, requireUser } from "@/lib/auth";
import { authorizeDocumentEntity } from "@/lib/documents/access";
import { getDocumentById } from "@/lib/documents/repository";
import {
  createSignedDownloadUrl,
  StorageNotConfiguredError,
} from "@/lib/documents/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const doc = await getDocumentById(id);
    if (!doc) throw new AuthError("Not found", 404);
    if (!doc.entity_type || !doc.entity_id) {
      throw new AuthError("Document is not linked to a workflow entity", 409);
    }

    await authorizeDocumentEntity(
      user,
      doc.entity_type,
      doc.entity_id,
      "read",
    );

    const signedUrl = await createSignedDownloadUrl(doc.storage_path, 60);

    await logAuditEvent({
      action: "document.downloaded",
      entity_type: "document",
      entity_id: doc.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        target_entity_type: doc.entity_type,
        target_entity_id: doc.entity_id,
        file_name: doc.file_name,
      },
    });

    return NextResponse.json({
      url: signedUrl,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      expires_in: 60,
    });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return errorResponse(err);
  }
}
