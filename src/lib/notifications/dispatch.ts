import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { insertNotifications } from "./repository";
import type { NotificationDispatch } from "./types";

/**
 * Notifications are a side-effect: a failure to dispatch must NEVER bring
 * down the originating workflow (e.g. an RFQ submission). Every helper here
 * swallows errors and logs in dev only. Treat the notification feed as
 * best-effort eventual consistency — the underlying workflow tables and
 * audit_logs remain the source of truth.
 */

async function safeDispatch(rows: NotificationDispatch[]): Promise<void> {
  try {
    await insertNotifications(rows);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[notify] dispatch failed:", err);
    }
  }
}

interface AdminRecipient {
  id: string;
  organization_id: string;
}

async function listAsgardAdmins(): Promise<AdminRecipient[]> {
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("users")
      .select("id, organization_id")
      .eq("role", "asgard_admin")
      .eq("status", "active");
    return (data ?? []) as AdminRecipient[];
  } catch {
    return [];
  }
}

async function listOrgUsers(
  orgId: string,
  roles: string[],
): Promise<AdminRecipient[]> {
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("users")
      .select("id, organization_id")
      .eq("organization_id", orgId)
      .in("role", roles)
      .eq("status", "active");
    return (data ?? []) as AdminRecipient[];
  } catch {
    return [];
  }
}

// ============================================================================
// RFQ submitted → notify Asgard admins
// ============================================================================

export async function notifyRfqSubmitted(input: {
  rfqId: string;
  rfqTitle: string;
  buyerOrgId: string;
}): Promise<void> {
  const admins = await listAsgardAdmins();
  if (admins.length === 0) return;
  await safeDispatch(
    admins.map((a) => ({
      user_id: a.id,
      organization_id: a.organization_id,
      action: "rfq.submitted",
      entity_type: "rfq",
      entity_id: input.rfqId,
      title: "New RFQ submitted",
      body: input.rfqTitle,
      href: `/admin/rfqs/${input.rfqId}`,
      metadata: { buyer_organization_id: input.buyerOrgId },
    })),
  );
}

// ============================================================================
// Quote requested → notify supplier admins of routed supplier
// ============================================================================

export async function notifyQuoteRequested(input: {
  routingDecisionId: string;
  workPackageId: string;
  supplierOrgId: string;
  rfqTitle: string | null;
}): Promise<void> {
  const recipients = await listOrgUsers(input.supplierOrgId, [
    "supplier_admin",
    "supplier_user",
  ]);
  if (recipients.length === 0) return;
  await safeDispatch(
    recipients.map((r) => ({
      user_id: r.id,
      organization_id: r.organization_id,
      action: "routing_decision.quote_requested",
      entity_type: "routing_decision",
      entity_id: input.routingDecisionId,
      title: "Quote requested",
      body: input.rfqTitle ?? "An Asgard operator has requested your quote.",
      href: `/supplier/quotes/${input.routingDecisionId}`,
      metadata: {
        work_package_id: input.workPackageId,
      },
    })),
  );
}

// ============================================================================
// Quote accepted → notify supplier admins (and the original quote author)
// ============================================================================

export async function notifyQuoteAccepted(input: {
  quoteId: string;
  supplierOrgId: string;
  workPackageId: string;
  rfqTitle: string | null;
}): Promise<void> {
  const recipients = await listOrgUsers(input.supplierOrgId, [
    "supplier_admin",
    "supplier_user",
  ]);
  if (recipients.length === 0) return;
  await safeDispatch(
    recipients.map((r) => ({
      user_id: r.id,
      organization_id: r.organization_id,
      action: "quote.accepted",
      entity_type: "quote",
      entity_id: input.quoteId,
      title: "Quote accepted",
      body: input.rfqTitle ?? "Your quote was accepted by Asgard.",
      href: `/supplier/jobs`,
      metadata: { work_package_id: input.workPackageId },
    })),
  );
}

// ============================================================================
// Job status update
//   → admin override or supplier change: notify the *other* side and the buyer
// ============================================================================

export async function notifyJobStatusUpdated(input: {
  jobId: string;
  jobNumber: string | null;
  newStatus: string;
  actorUserId: string;
  actorRole: string;
  supplierOrgId: string;
}): Promise<void> {
  const buyerOrgId = await resolveBuyerOrgForJob(input.jobId);
  const recipients: AdminRecipient[] = [];

  // Always notify the supplier admins for the routed supplier — except the actor.
  const supplierUsers = await listOrgUsers(input.supplierOrgId, [
    "supplier_admin",
    "supplier_user",
  ]);
  for (const u of supplierUsers) {
    if (u.id !== input.actorUserId) recipients.push(u);
  }

  // Notify Asgard admins on supplier-driven moves; skip when an admin acted.
  if (input.actorRole !== "asgard_admin") {
    recipients.push(...(await listAsgardAdmins()));
  }

  // Notify buyer when known.
  if (buyerOrgId) {
    recipients.push(
      ...(await listOrgUsers(buyerOrgId, ["buyer_admin", "buyer_user"])),
    );
  }

  if (recipients.length === 0) return;

  // Dedup by user id (a buyer could overlap with admin in pathological setups).
  const seen = new Set<string>();
  const dedup = recipients.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const label = input.jobNumber ?? input.jobId.slice(0, 8);
  await safeDispatch(
    dedup.map((r) => ({
      user_id: r.id,
      organization_id: r.organization_id,
      action: "job.status_updated",
      entity_type: "job",
      entity_id: input.jobId,
      title: `Job ${label} → ${input.newStatus}`,
      body: null,
      href: hrefForJob(r.organization_id, {
        jobId: input.jobId,
        supplierOrgId: input.supplierOrgId,
        buyerOrgId,
      }),
      metadata: {
        status: input.newStatus,
        actor_role: input.actorRole,
      },
    })),
  );
}

async function resolveBuyerOrgForJob(jobId: string): Promise<string | null> {
  try {
    const sb = createServiceSupabase();
    const { data } = await sb
      .from("jobs")
      .select(
        "id, work_packages(rfqs(programs(buyer_organization_id)))",
      )
      .eq("id", jobId)
      .maybeSingle();
    type Row = {
      id: string;
      work_packages:
        | {
            rfqs:
              | { programs: { buyer_organization_id: string } | null }
              | Array<{ programs: { buyer_organization_id: string } | null }>
              | null;
          }
        | Array<{
            rfqs:
              | { programs: { buyer_organization_id: string } | null }
              | Array<{ programs: { buyer_organization_id: string } | null }>
              | null;
          }>
        | null;
    };
    const row = data as Row | null;
    if (!row) return null;
    const wp = Array.isArray(row.work_packages)
      ? row.work_packages[0]
      : row.work_packages;
    const rfqs = Array.isArray(wp?.rfqs) ? wp?.rfqs[0] : wp?.rfqs;
    const programs = rfqs?.programs ?? null;
    return programs?.buyer_organization_id ?? null;
  } catch {
    return null;
  }
}

function hrefForJob(
  recipientOrgId: string,
  input: {
    jobId: string;
    supplierOrgId: string;
    buyerOrgId: string | null;
  },
): string {
  if (recipientOrgId === input.supplierOrgId) {
    return `/supplier/jobs/${input.jobId}`;
  }
  if (input.buyerOrgId && recipientOrgId === input.buyerOrgId) {
    return `/buyer/jobs`;
  }
  return `/admin/jobs/${input.jobId}`;
}
