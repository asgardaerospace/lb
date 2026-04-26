import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { errorResponse } from "@/lib/api";
import { logAuditEvent } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { authorizeDocumentEntity } from "@/lib/documents/access";
import { insertDocument } from "@/lib/documents/repository";
import {
  buildStoragePath,
  StorageNotConfiguredError,
  uploadToStorage,
} from "@/lib/documents/storage";
import {
  DOCUMENT_ENTITY_TYPES,
  MAX_UPLOAD_BYTES,
  sanitizeFileName,
  type DocumentEntityType,
} from "@/lib/documents/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();

    const entityType = form.get("entity_type");
    const entityId = form.get("entity_id");
    const file = form.get("file");
    const description = form.get("description");
    const fileType = form.get("file_type");

    if (
      typeof entityType !== "string" ||
      !DOCUMENT_ENTITY_TYPES.includes(entityType as DocumentEntityType)
    ) {
      return NextResponse.json(
        { error: "Invalid entity_type" },
        { status: 400 },
      );
    }
    if (typeof entityId !== "string" || entityId.length < 1) {
      return NextResponse.json({ error: "entity_id required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "file is empty" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_UPLOAD_BYTES} bytes` },
        { status: 413 },
      );
    }

    const resolvedEntityType = entityType as DocumentEntityType;
    const { uploaderOrganizationId } = await authorizeDocumentEntity(
      user,
      resolvedEntityType,
      entityId,
      "write",
    );

    const documentId = randomUUID();
    const safeName = sanitizeFileName(file.name || "upload.bin");
    const path = buildStoragePath(documentId, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToStorage(path, buffer, file.type || "application/octet-stream");

    const row = await insertDocument({
      organization_id: uploaderOrganizationId,
      entity_type: resolvedEntityType,
      entity_id: entityId,
      file_type:
        typeof fileType === "string" && fileType.length > 0
          ? fileType
          : (file.type || "application/octet-stream"),
      file_name: safeName,
      mime_type: file.type || null,
      size_bytes: file.size,
      storage_path: path,
      description:
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : null,
      created_by: user.id,
    });

    // Override the row id to the documentId we used in the storage path so
    // they line up. Use the inserted row's id (the random uuid in the row may
    // differ from the storage uuid on collision) — Supabase generates ids
    // server-side, so we keep storage_path and id loosely linked via the
    // path string and it remains correct because we recorded the path.
    await logAuditEvent({
      action: "document.uploaded",
      entity_type: "document",
      entity_id: row.id,
      user_id: user.id,
      organization_id: user.organization_id,
      metadata: {
        target_entity_type: row.entity_type,
        target_entity_id: row.entity_id,
        file_name: row.file_name,
        size_bytes: row.size_bytes,
      },
    });

    return NextResponse.json({ document: row }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return errorResponse(err);
  }
}
