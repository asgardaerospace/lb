import { createServiceSupabase } from "@/lib/supabase/server";
import type { DocumentEntityType, DocumentRow } from "./types";

export async function listDocumentsForEntity(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<DocumentRow[]> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, organization_id, entity_type, entity_id, file_type, file_name, mime_type, size_bytes, storage_path, description, compliance_flags, created_at, created_by",
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Document list failed: ${error.message}`);
  return (data ?? []) as DocumentRow[];
}

export async function getDocumentById(
  id: string,
): Promise<DocumentRow | null> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, organization_id, entity_type, entity_id, file_type, file_name, mime_type, size_bytes, storage_path, description, compliance_flags, created_at, created_by",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Document fetch failed: ${error.message}`);
  return (data as DocumentRow | null) ?? null;
}

export interface InsertDocumentInput {
  organization_id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  file_type: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  storage_path: string;
  description: string | null;
  created_by: string;
}

export async function insertDocument(
  input: InsertDocumentInput,
): Promise<DocumentRow> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("documents")
    .insert({
      organization_id: input.organization_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      file_type: input.file_type,
      file_name: input.file_name,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes,
      storage_path: input.storage_path,
      description: input.description,
      created_by: input.created_by,
    })
    .select(
      "id, organization_id, entity_type, entity_id, file_type, file_name, mime_type, size_bytes, storage_path, description, compliance_flags, created_at, created_by",
    )
    .single();
  if (error || !data) {
    throw new Error(`Document insert failed: ${error?.message ?? "no row"}`);
  }
  return data as DocumentRow;
}
