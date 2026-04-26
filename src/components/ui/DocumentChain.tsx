"use client";

import { useState } from "react";
import type {
  DocumentChainSnapshot,
  PartContext,
} from "@/lib/documents/chain";
import { Banner } from "./Banner";

interface DocumentRow {
  id: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  description: string | null;
  created_at: string;
}

interface Props {
  snapshot: DocumentChainSnapshot;
  /** When true, includes the job's own documents at the top of the chain. */
  includeJobDocuments?: boolean;
}

function formatBytes(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Read-only display of the RFQ → Quote → Job document chain. Each section
 * shows where the document came from so users always understand the
 * upstream lineage. Downloads route through the same /api/documents/[id]/
 * download endpoint that DocumentsSection uses, so access checks are
 * uniform.
 */
export function DocumentChain({ snapshot, includeJobDocuments = false }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function download(documentId: string) {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Download failed");
      window.open(data.url as string, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  const { context, rfqDocuments, partDocuments, quoteDocuments, jobDocuments } =
    snapshot;

  const totalUpstream =
    rfqDocuments.length +
    quoteDocuments.length +
    partDocuments.reduce((acc, p) => acc + p.documents.length, 0) +
    (includeJobDocuments ? jobDocuments.length : 0);

  if (totalUpstream === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
        No documents anywhere on this RFQ → Quote → Job chain yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Banner tone="error" dense>
          {error}
        </Banner>
      )}

      {includeJobDocuments && jobDocuments.length > 0 && (
        <ChainSection
          eyebrow="On this job"
          subtitle={
            context.jobNumber ? `Job ${context.jobNumber}` : "This job"
          }
          documents={jobDocuments}
          onDownload={download}
        />
      )}

      {quoteDocuments.length > 0 && (
        <ChainSection
          eyebrow="From quote"
          subtitle={
            context.workPackageName
              ? `Work package · ${context.workPackageName}`
              : "Supplier quote"
          }
          documents={quoteDocuments}
          onDownload={download}
        />
      )}

      {rfqDocuments.length > 0 && (
        <ChainSection
          eyebrow="From RFQ"
          subtitle={context.rfqTitle ?? "RFQ"}
          documents={rfqDocuments}
          onDownload={download}
        />
      )}

      {partDocuments.length > 0 && (
        <PartsChainSection
          parts={partDocuments}
          onDownload={download}
        />
      )}
    </div>
  );
}

function ChainSection({
  eyebrow,
  subtitle,
  documents,
  onDownload,
}: {
  eyebrow: string;
  subtitle: string;
  documents: DocumentRow[];
  onDownload: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
          {eyebrow}
        </span>
        <span className="truncate text-[11px] text-slate-500">{subtitle}</span>
      </div>
      <DocumentList documents={documents} onDownload={onDownload} />
    </div>
  );
}

function PartsChainSection({
  parts,
  onDownload,
}: {
  parts: Array<{ part: PartContext; documents: DocumentRow[] }>;
  onDownload: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
        From parts
      </div>
      <div className="space-y-2">
        {parts.map(({ part, documents }) => (
          <div key={part.id}>
            <div className="mb-1 text-[11px] text-slate-500">
              <span className="font-mono text-slate-400">{part.part_number}</span>
              {part.part_name ? ` · ${part.part_name}` : ""}
            </div>
            <DocumentList documents={documents} onDownload={onDownload} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentList({
  documents,
  onDownload,
}: {
  documents: DocumentRow[];
  onDownload: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800 bg-slate-900/40">
      {documents.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onDownload(d.id)}
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
            onClick={() => onDownload(d.id)}
            className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Download →
          </button>
        </li>
      ))}
    </ul>
  );
}
