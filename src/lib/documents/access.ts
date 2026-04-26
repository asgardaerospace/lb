import { AuthError, type SessionUser } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { DocumentEntityType } from "./types";

type AccessMode = "read" | "write";

interface EntityResolution {
  uploaderOrganizationId: string;
}

/**
 * Resolves whether `user` may attach (write) or view (read) a document to the
 * given entity. Returns the organization_id that should own the document row
 * (typically the uploader's org, but may be derived from the entity for cross-
 * org clarity in audits).
 *
 * Rules:
 *   asgard_admin           — read + write any entity.
 *   buyer_admin/user       — RFQ + part on RFQs in their org. Read-only access
 *                            to quote/job documents on their own RFQs.
 *   supplier_admin/user    — quote + job in their org. Read-only access to RFQ
 *                            + part docs for RFQs they have an active routing
 *                            decision against.
 *
 * Throws AuthError(403) when access is denied, AuthError(404) when the entity
 * doesn't exist.
 */
export async function authorizeDocumentEntity(
  user: SessionUser,
  entityType: DocumentEntityType,
  entityId: string,
  mode: AccessMode,
): Promise<EntityResolution> {
  const sb = createServiceSupabase();

  if (entityType === "rfq" || entityType === "part") {
    // Resolve to buyer org via rfq -> program.
    const rfqId = await resolveRfqId(entityType, entityId);
    if (!rfqId) throw new AuthError("Not found", 404);
    const { data: rfq } = await sb
      .from("rfqs")
      .select("id, program_id, programs(buyer_organization_id)")
      .eq("id", rfqId)
      .maybeSingle();
    type RfqRow = {
      id: string;
      program_id: string;
      programs: { buyer_organization_id: string } | null;
    };
    const row = rfq as RfqRow | null;
    if (!row?.programs) throw new AuthError("Not found", 404);
    const buyerOrgId = row.programs.buyer_organization_id;

    if (user.role === "asgard_admin") {
      return { uploaderOrganizationId: user.organization_id };
    }
    if (user.role === "buyer_admin" || user.role === "buyer_user") {
      if (buyerOrgId !== user.organization_id) {
        throw new AuthError("Forbidden", 403);
      }
      return { uploaderOrganizationId: user.organization_id };
    }
    if (user.role === "supplier_admin" || user.role === "supplier_user") {
      if (mode === "write") throw new AuthError("Forbidden", 403);
      const { count } = await sb
        .from("routing_decisions")
        .select("id, work_packages!inner(rfq_id)", {
          count: "exact",
          head: true,
        })
        .eq("supplier_organization_id", user.organization_id)
        .eq("work_packages.rfq_id", rfqId);
      if ((count ?? 0) === 0) throw new AuthError("Forbidden", 403);
      return { uploaderOrganizationId: user.organization_id };
    }
    throw new AuthError("Forbidden", 403);
  }

  if (entityType === "quote") {
    const { data: q } = await sb
      .from("quotes")
      .select(
        "id, supplier_organization_id, work_packages(rfq_id, rfqs(programs(buyer_organization_id)))",
      )
      .eq("id", entityId)
      .maybeSingle();
    type QuoteRow = {
      id: string;
      supplier_organization_id: string;
      work_packages: {
        rfq_id: string;
        rfqs: {
          programs: { buyer_organization_id: string } | null;
        } | null;
      } | null;
    };
    const quote = q as QuoteRow | null;
    if (!quote) throw new AuthError("Not found", 404);
    const buyerOrgId =
      quote.work_packages?.rfqs?.programs?.buyer_organization_id ?? null;

    if (user.role === "asgard_admin") {
      return { uploaderOrganizationId: user.organization_id };
    }
    if (user.role === "supplier_admin" || user.role === "supplier_user") {
      if (quote.supplier_organization_id !== user.organization_id) {
        throw new AuthError("Forbidden", 403);
      }
      return { uploaderOrganizationId: user.organization_id };
    }
    if (user.role === "buyer_admin" || user.role === "buyer_user") {
      if (mode === "write") throw new AuthError("Forbidden", 403);
      if (buyerOrgId !== user.organization_id) {
        throw new AuthError("Forbidden", 403);
      }
      return { uploaderOrganizationId: user.organization_id };
    }
    throw new AuthError("Forbidden", 403);
  }

  if (entityType === "job") {
    const { data: j } = await sb
      .from("jobs")
      .select(
        "id, supplier_organization_id, work_packages(rfq_id, rfqs(programs(buyer_organization_id)))",
      )
      .eq("id", entityId)
      .maybeSingle();
    type JobRow = {
      id: string;
      supplier_organization_id: string;
      work_packages: {
        rfq_id: string;
        rfqs: {
          programs: { buyer_organization_id: string } | null;
        } | null;
      } | null;
    };
    const job = j as JobRow | null;
    if (!job) throw new AuthError("Not found", 404);
    const buyerOrgId =
      job.work_packages?.rfqs?.programs?.buyer_organization_id ?? null;

    if (user.role === "asgard_admin") {
      return { uploaderOrganizationId: user.organization_id };
    }
    if (user.role === "supplier_admin" || user.role === "supplier_user") {
      if (job.supplier_organization_id !== user.organization_id) {
        throw new AuthError("Forbidden", 403);
      }
      return { uploaderOrganizationId: user.organization_id };
    }
    if (user.role === "buyer_admin" || user.role === "buyer_user") {
      if (mode === "write") throw new AuthError("Forbidden", 403);
      if (buyerOrgId !== user.organization_id) {
        throw new AuthError("Forbidden", 403);
      }
      return { uploaderOrganizationId: user.organization_id };
    }
    throw new AuthError("Forbidden", 403);
  }

  throw new AuthError("Forbidden", 403);
}

async function resolveRfqId(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<string | null> {
  if (entityType === "rfq") return entityId;
  if (entityType === "part") {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("parts")
      .select("rfq_id")
      .eq("id", entityId)
      .maybeSingle();
    const row = data as { rfq_id: string } | null;
    return row?.rfq_id ?? null;
  }
  return null;
}
