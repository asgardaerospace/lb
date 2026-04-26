import { z } from "zod";

export const DOCUMENT_ENTITY_TYPES = ["rfq", "part", "quote", "job"] as const;
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export interface DocumentRow {
  id: string;
  organization_id: string;
  entity_type: DocumentEntityType | null;
  entity_id: string | null;
  file_type: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  description: string | null;
  compliance_flags: string[];
  created_at: string;
  created_by: string | null;
}

export const documentEntitySchema = z.object({
  entity_type: z.enum(DOCUMENT_ENTITY_TYPES),
  entity_id: z.string().uuid(),
});

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export function sanitizeFileName(name: string): string {
  const trimmed = name.trim().replace(/[\\/]/g, "_");
  return trimmed.slice(-180).replace(/[^A-Za-z0-9._-]/g, "_") || "upload.bin";
}
