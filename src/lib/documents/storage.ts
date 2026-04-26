import { createServiceSupabase } from "@/lib/supabase/server";

export const DOCUMENTS_BUCKET = "launchbelt-documents";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage not connected. Connect Supabase Storage to enable uploads.",
    );
    this.name = "StorageNotConfiguredError";
  }
}

export function isStorageEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Quick reachability check: lists one row from the bucket. Returns false if the
 * bucket doesn't exist or storage isn't configured. Used by UI route handlers
 * to render the "storage not connected" disabled state without crashing.
 */
export async function isStorageReady(): Promise<boolean> {
  if (!isStorageEnvConfigured()) return false;
  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .list("", { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

export function buildStoragePath(
  documentId: string,
  fileName: string,
): string {
  return `${documentId}/${fileName}`;
}

export async function uploadToStorage(
  path: string,
  file: ArrayBuffer | Buffer,
  contentType: string,
): Promise<void> {
  if (!isStorageEnvConfigured()) throw new StorageNotConfiguredError();
  const supabase = createServiceSupabase();
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: false,
    });
  if (error) {
    if (
      error.message.toLowerCase().includes("bucket") &&
      error.message.toLowerCase().includes("not found")
    ) {
      throw new StorageNotConfiguredError();
    }
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

export async function createSignedDownloadUrl(
  path: string,
  expiresInSeconds: number = 60,
): Promise<string> {
  if (!isStorageEnvConfigured()) throw new StorageNotConfiguredError();
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(
      `Could not generate signed URL: ${error?.message ?? "unknown"}`,
    );
  }
  return data.signedUrl;
}

export async function removeFromStorage(path: string): Promise<void> {
  if (!isStorageEnvConfigured()) return;
  const supabase = createServiceSupabase();
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
}
