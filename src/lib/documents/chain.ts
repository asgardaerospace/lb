import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { listDocumentsForEntity } from "./repository";
import type { DocumentRow } from "./types";

export interface PartContext {
  id: string;
  part_number: string;
  part_name: string | null;
}

export interface DocumentChainContext {
  jobId: string;
  jobNumber: string | null;
  workPackageId: string;
  workPackageName: string | null;
  rfqId: string | null;
  rfqTitle: string | null;
  quoteId: string | null;
  parts: PartContext[];
}

export interface DocumentChainSnapshot {
  context: DocumentChainContext;
  rfqDocuments: DocumentRow[];
  partDocuments: Array<{ part: PartContext; documents: DocumentRow[] }>;
  quoteDocuments: DocumentRow[];
  jobDocuments: DocumentRow[];
}

interface QuoteChainRow {
  id: string;
  work_package_id: string;
  work_packages:
    | {
        id: string;
        package_name: string | null;
        rfq_id: string;
        rfqs: { id: string; rfq_title: string } | { id: string; rfq_title: string }[] | null;
      }
    | Array<{
        id: string;
        package_name: string | null;
        rfq_id: string;
        rfqs:
          | { id: string; rfq_title: string }
          | { id: string; rfq_title: string }[]
          | null;
      }>
    | null;
}

interface JobChainRow {
  id: string;
  job_number: string | null;
  work_package_id: string;
  quote_id: string | null;
  work_packages:
    | {
        id: string;
        package_name: string | null;
        rfq_id: string;
        rfqs: { id: string; rfq_title: string } | { id: string; rfq_title: string }[] | null;
      }
    | Array<{
        id: string;
        package_name: string | null;
        rfq_id: string;
        rfqs:
          | { id: string; rfq_title: string }
          | { id: string; rfq_title: string }[]
          | null;
      }>
    | null;
}

/**
 * Resolve the RFQ → Quote → Job document chain for a single job and load
 * every document attached anywhere along the chain (job + quote + rfq +
 * each part). Returns lineage context plus four grouped lists.
 *
 * Tolerant: any individual entity's document fetch falls back to [] so a
 * partial outage doesn't blow up the whole page.
 */
export async function loadDocumentChainForJob(
  jobId: string,
): Promise<DocumentChainSnapshot> {
  const sb = createServiceSupabase();

  const { data, error } = await sb
    .from("jobs")
    .select(
      "id, job_number, work_package_id, quote_id, work_packages(id, package_name, rfq_id, rfqs(id, rfq_title))",
    )
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new Error(`Job lookup failed: ${error.message}`);
  if (!data) throw new Error("Job not found");

  const row = data as unknown as JobChainRow;
  const wp = Array.isArray(row.work_packages)
    ? row.work_packages[0]
    : row.work_packages;
  const rfq = wp ? (Array.isArray(wp.rfqs) ? wp.rfqs[0] : wp.rfqs) : null;

  const rfqId = rfq?.id ?? null;

  // Parts on the RFQ.
  let parts: PartContext[] = [];
  if (rfqId) {
    const { data: partRows } = await sb
      .from("parts")
      .select("id, part_number, part_name")
      .eq("rfq_id", rfqId)
      .order("part_number", { ascending: true });
    parts = (partRows ?? []) as PartContext[];
  }

  const context: DocumentChainContext = {
    jobId: row.id,
    jobNumber: row.job_number,
    workPackageId: row.work_package_id,
    workPackageName: wp?.package_name ?? null,
    rfqId,
    rfqTitle: rfq?.rfq_title ?? null,
    quoteId: row.quote_id ?? null,
    parts,
  };

  const safe = (p: Promise<DocumentRow[]>) =>
    p.catch(() => [] as DocumentRow[]);

  const [rfqDocuments, jobDocuments, quoteDocuments, ...partDocs] =
    await Promise.all([
      rfqId ? safe(listDocumentsForEntity("rfq", rfqId)) : Promise.resolve([]),
      safe(listDocumentsForEntity("job", row.id)),
      row.quote_id
        ? safe(listDocumentsForEntity("quote", row.quote_id))
        : Promise.resolve([]),
      ...parts.map((p) => safe(listDocumentsForEntity("part", p.id))),
    ]);

  const partDocuments = parts
    .map((part, i) => ({ part, documents: partDocs[i] ?? [] }))
    .filter((entry) => entry.documents.length > 0);

  return {
    context,
    rfqDocuments,
    partDocuments,
    quoteDocuments,
    jobDocuments,
  };
}

/**
 * Same lineage view but anchored on a quote — used on quote detail pages
 * before a job has been created. `jobDocuments` is empty in this snapshot.
 */
export async function loadDocumentChainForQuote(
  quoteId: string,
): Promise<DocumentChainSnapshot> {
  const sb = createServiceSupabase();

  const { data, error } = await sb
    .from("quotes")
    .select(
      "id, work_package_id, work_packages(id, package_name, rfq_id, rfqs(id, rfq_title))",
    )
    .eq("id", quoteId)
    .maybeSingle();
  if (error) throw new Error(`Quote lookup failed: ${error.message}`);
  if (!data) throw new Error("Quote not found");

  const row = data as unknown as QuoteChainRow;
  const wp = Array.isArray(row.work_packages)
    ? row.work_packages[0]
    : row.work_packages;
  const rfq = wp ? (Array.isArray(wp.rfqs) ? wp.rfqs[0] : wp.rfqs) : null;
  const rfqId = rfq?.id ?? null;

  let parts: PartContext[] = [];
  if (rfqId) {
    const { data: partRows } = await sb
      .from("parts")
      .select("id, part_number, part_name")
      .eq("rfq_id", rfqId)
      .order("part_number", { ascending: true });
    parts = (partRows ?? []) as PartContext[];
  }

  const context: DocumentChainContext = {
    jobId: "",
    jobNumber: null,
    workPackageId: row.work_package_id,
    workPackageName: wp?.package_name ?? null,
    rfqId,
    rfqTitle: rfq?.rfq_title ?? null,
    quoteId: row.id,
    parts,
  };

  const safe = (p: Promise<DocumentRow[]>) =>
    p.catch(() => [] as DocumentRow[]);

  const [rfqDocuments, quoteDocuments, ...partDocs] = await Promise.all([
    rfqId ? safe(listDocumentsForEntity("rfq", rfqId)) : Promise.resolve([]),
    safe(listDocumentsForEntity("quote", row.id)),
    ...parts.map((p) => safe(listDocumentsForEntity("part", p.id))),
  ]);

  const partDocuments = parts
    .map((part, i) => ({ part, documents: partDocs[i] ?? [] }))
    .filter((entry) => entry.documents.length > 0);

  return {
    context,
    rfqDocuments,
    partDocuments,
    quoteDocuments,
    jobDocuments: [],
  };
}
