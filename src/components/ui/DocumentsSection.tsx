"use client";

import { useState } from "react";
import { Banner } from "./Banner";
import { useToast } from "./Toast";

interface DocumentRow {
  id: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  description: string | null;
  created_at: string;
}

interface Props {
  entityType: "rfq" | "part" | "quote" | "job";
  entityId: string;
  canUpload: boolean;
  storageReady: boolean;
  initialDocuments: DocumentRow[];
  title?: string;
  description?: string;
  emptyHint?: string;
}

function formatBytes(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentsSection({
  entityType,
  entityId,
  canUpload,
  storageReady,
  initialDocuments,
  title = "Documents",
  description,
  emptyHint = "No documents attached yet.",
}: Props) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docDescription, setDocDescription] = useState("");
  const [filePicked, setFilePicked] = useState<File | null>(null);

  async function refresh() {
    try {
      const res = await fetch(
        `/api/documents?entity_type=${entityType}&entity_id=${entityId}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      // ignore — keep current list
    }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!filePicked) {
      setError("Pick a file first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("entity_type", entityType);
      fd.append("entity_id", entityId);
      fd.append("file", filePicked);
      if (docDescription.trim()) fd.append("description", docDescription.trim());

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocDescription("");
      setFilePicked(null);
      const fileInput = document.getElementById(
        `documents-file-${entityType}-${entityId}`,
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      toast({
        tone: "success",
        title: "Document uploaded",
        body: filePicked.name,
      });
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast({ tone: "error", title: "Upload failed", body: msg });
    } finally {
      setBusy(false);
    }
  }

  async function download(documentId: string) {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Download failed");
      window.open(data.url as string, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      setError(msg);
      toast({ tone: "error", title: "Download failed", body: msg });
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
          {title}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
          {emptyHint}
        </p>
      ) : (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800 bg-slate-900/40">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => download(d.id)}
                  className="block truncate text-left font-medium text-slate-100 transition hover:text-cyan-300"
                  title={d.file_name ?? "document"}
                >
                  {d.file_name ?? "(unnamed)"}
                </button>
                <div className="mt-0.5 truncate text-[11px] text-slate-500">
                  {formatBytes(d.size_bytes)}
                  {d.mime_type ? ` · ${d.mime_type}` : ""}
                  {d.description ? ` · ${d.description}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => download(d.id)}
                className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                Download →
              </button>
            </li>
          ))}
        </ul>
      )}

      {canUpload ? (
        storageReady ? (
          <form
            onSubmit={upload}
            className="space-y-3 rounded-md border border-slate-800 bg-slate-950/40 p-3"
          >
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                File
              </span>
              <input
                id={`documents-file-${entityType}-${entityId}`}
                type="file"
                onChange={(e) => setFilePicked(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border file:border-slate-700 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Description (optional)
              </span>
              <input
                type="text"
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder="e.g. Rev B drawing pack"
                className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">
                CAD, drawings, specs, certs — up to 25 MB. Stored privately.
              </p>
              <button
                type="submit"
                disabled={busy || !filePicked}
                className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
            {error && (
              <Banner tone="error" dense>
                {error}
              </Banner>
            )}
          </form>
        ) : (
          <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
            Storage not connected. Connect Supabase Storage to enable uploads.
          </div>
        )
      ) : null}
    </section>
  );
}
