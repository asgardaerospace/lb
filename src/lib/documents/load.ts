import { isStorageReady } from "./storage";
import { listDocumentsForEntity } from "./repository";
import type { DocumentEntityType, DocumentRow } from "./types";

/**
 * Server-side helper for page components: loads documents + storage readiness
 * tolerantly so a missing Supabase env / unavailable storage doesn't crash
 * the page render. Falls back to empty list + storageReady=false.
 */
export async function loadDocumentsForPage(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<{ documents: DocumentRow[]; storageReady: boolean }> {
  const [storageReady, documents] = await Promise.all([
    isStorageReady(),
    listDocumentsForEntity(entityType, entityId).catch(
      () => [] as DocumentRow[],
    ),
  ]);
  return { documents, storageReady };
}
