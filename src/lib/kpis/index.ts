import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * Centralized KPI loaders. Each returns a typed metrics object or `null` on
 * error, so dashboards can fall back to preview values without crashing.
 *
 * All counts are computed in-process via lightweight aggregates rather than
 * round-tripping per-org RPC functions; the dashboards only fetch a handful
 * of small tables.
 */

const PRODUCTION_STATUSES = new Set([
  "scheduled",
  "in_production",
  "inspection",
  "shipped",
]);

// ============================================================================
// Admin
// ============================================================================

export interface AdminKpis {
  programCount: number;
  rfqCount: number;
  rfqsSubmitted: number;
  quoteCount: number;
  jobCount: number;
  jobsActive: number;
  inProduction: number;
  routedValue: number;
  supplierUtilization: number; // 0-100, share of approved suppliers with an active job
}

export async function loadAdminKpis(): Promise<AdminKpis | null> {
  try {
    const sb = createServiceSupabase();
    const [programs, rfqs, quotes, jobs, suppliers] = await Promise.all([
      sb.from("programs").select("id", { count: "exact", head: true }),
      sb.from("rfqs").select("id, status", { count: "exact" }),
      sb.from("quotes").select("quoted_price, status", { count: "exact" }),
      sb.from("jobs").select("status, supplier_organization_id", {
        count: "exact",
      }),
      sb
        .from("supplier_profiles")
        .select("organization_id", { count: "exact" })
        .eq("approval_status", "approved"),
    ]);

    const rfqsSubmitted = (rfqs.data ?? []).filter(
      (r) => (r as { status: string }).status !== "draft",
    ).length;

    const acceptedTotal = (quotes.data ?? [])
      .filter((q) => (q as { status: string }).status === "accepted")
      .reduce(
        (acc, q) => acc + (Number((q as { quoted_price: unknown }).quoted_price) || 0),
        0,
      );

    const jobRows = (jobs.data ?? []) as Array<{
      status: string;
      supplier_organization_id: string;
    }>;
    const jobsActive = jobRows.filter((j) => PRODUCTION_STATUSES.has(j.status))
      .length;
    const inProduction = jobRows.filter((j) => j.status === "in_production")
      .length;

    const activeSupplierIds = new Set(
      jobRows
        .filter((j) => PRODUCTION_STATUSES.has(j.status))
        .map((j) => j.supplier_organization_id),
    );
    const approvedSuppliers = suppliers.count ?? 0;
    const supplierUtilization =
      approvedSuppliers === 0
        ? 0
        : Math.round((activeSupplierIds.size / approvedSuppliers) * 100);

    return {
      programCount: programs.count ?? 0,
      rfqCount: rfqs.count ?? 0,
      rfqsSubmitted,
      quoteCount: quotes.count ?? 0,
      jobCount: jobs.count ?? 0,
      jobsActive,
      inProduction,
      routedValue: acceptedTotal,
      supplierUtilization,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Supplier
// ============================================================================

export interface SupplierKpis {
  partsAssigned: number;
  workPackagesAssigned: number;
  quotesPending: number;
  quotesSubmitted: number;
  quotesAccepted: number;
  quotesLost: number; // rejected + declined
  winRatePct: number; // 0-100; null if no decided quotes yet
  jobsTotal: number;
  jobsActive: number;
  jobsInProduction: number;
  jobsComplete: number;
  avgResponseHours: number | null;
}

export async function loadSupplierKpis(
  supplierOrgId: string,
): Promise<SupplierKpis | null> {
  try {
    const sb = createServiceSupabase();
    const [routingRes, quoteRes, jobRes] = await Promise.all([
      sb
        .from("routing_decisions")
        .select(
          "id, work_package_id, quote_requested_at, work_packages(work_package_parts(part_id))",
        )
        .eq("supplier_organization_id", supplierOrgId)
        .eq("routing_status", "quote_requested"),
      sb
        .from("quotes")
        .select("id, work_package_id, status, submitted_at")
        .eq("supplier_organization_id", supplierOrgId),
      sb
        .from("jobs")
        .select("status")
        .eq("supplier_organization_id", supplierOrgId),
    ]);

    type RoutingRow = {
      id: string;
      work_package_id: string;
      quote_requested_at: string | null;
      work_packages:
        | { work_package_parts: Array<{ part_id: string }> | null }
        | Array<{ work_package_parts: Array<{ part_id: string }> | null }>
        | null;
    };
    const routing = (routingRes.data ?? []) as unknown as RoutingRow[];

    const quotes = (quoteRes.data ?? []) as Array<{
      work_package_id: string;
      status: string;
      submitted_at: string | null;
    }>;
    const jobs = (jobRes.data ?? []) as Array<{ status: string }>;

    let partsAssigned = 0;
    for (const r of routing) {
      const wp = Array.isArray(r.work_packages)
        ? r.work_packages[0]
        : r.work_packages;
      partsAssigned += wp?.work_package_parts?.length ?? 0;
    }

    const submittedQuoteWps = new Set(
      quotes
        .filter((q) => q.status !== "draft")
        .map((q) => q.work_package_id),
    );
    const quotesPending = routing.filter(
      (r) => !submittedQuoteWps.has(r.work_package_id),
    ).length;

    const quotesSubmitted = quotes.filter((q) => q.status !== "draft").length;
    const quotesAccepted = quotes.filter((q) => q.status === "accepted").length;
    const quotesLost = quotes.filter(
      (q) => q.status === "rejected" || q.status === "declined",
    ).length;
    const decided = quotesAccepted + quotesLost;
    const winRatePct = decided === 0 ? 0 : Math.round((quotesAccepted / decided) * 100);

    // Avg response time: routing.quote_requested_at → quote.submitted_at, joined on work_package_id
    const requestByWp = new Map<string, string>();
    for (const r of routing) {
      if (r.quote_requested_at) {
        requestByWp.set(r.work_package_id, r.quote_requested_at);
      }
    }
    const responseHours: number[] = [];
    for (const q of quotes) {
      if (q.status === "draft" || !q.submitted_at) continue;
      const requested = requestByWp.get(q.work_package_id);
      if (!requested) continue;
      const ms = new Date(q.submitted_at).getTime() - new Date(requested).getTime();
      if (ms > 0) responseHours.push(ms / (1000 * 60 * 60));
    }
    const avgResponseHours =
      responseHours.length === 0
        ? null
        : Math.round(
            (responseHours.reduce((a, b) => a + b, 0) / responseHours.length) * 10,
          ) / 10;

    const jobsActive = jobs.filter((j) => PRODUCTION_STATUSES.has(j.status))
      .length;
    const jobsInProduction = jobs.filter((j) => j.status === "in_production")
      .length;
    const jobsComplete = jobs.filter((j) => j.status === "complete").length;

    return {
      partsAssigned,
      workPackagesAssigned: routing.length,
      quotesPending,
      quotesSubmitted,
      quotesAccepted,
      quotesLost,
      winRatePct,
      jobsTotal: jobs.length,
      jobsActive,
      jobsInProduction,
      jobsComplete,
      avgResponseHours,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Buyer
// ============================================================================

export interface BuyerKpis {
  programsActive: number;
  programsTotal: number;
  rfqsTotal: number;
  rfqsSubmitted: number;
  rfqsInRouting: number;
  jobsTotal: number;
  jobsInProduction: number;
  jobsComplete: number;
}

export async function loadBuyerKpis(
  buyerOrgId: string,
): Promise<BuyerKpis | null> {
  try {
    const sb = createServiceSupabase();

    // Programs.
    const programsRes = await sb
      .from("programs")
      .select("id, status")
      .eq("buyer_organization_id", buyerOrgId);

    type ProgramRow = { id: string; status: string };
    const programs = (programsRes.data ?? []) as ProgramRow[];
    const programIds = programs.map((p) => p.id);

    // RFQs scoped to those programs.
    let rfqs: Array<{ status: string }> = [];
    if (programIds.length > 0) {
      const rfqsRes = await sb.from("rfqs").select("status").in("program_id", programIds);
      rfqs = (rfqsRes.data ?? []) as Array<{ status: string }>;
    }

    // Jobs visible to this buyer.
    const jobsRes = await sb
      .from("jobs")
      .select(
        "status, work_packages!inner(rfqs!inner(programs!inner(buyer_organization_id)))",
      )
      .eq("work_packages.rfqs.programs.buyer_organization_id", buyerOrgId);
    const jobs = (jobsRes.data ?? []) as Array<{ status: string }>;

    return {
      programsActive: programs.filter((p) => p.status === "active").length,
      programsTotal: programs.length,
      rfqsTotal: rfqs.length,
      rfqsSubmitted: rfqs.filter((r) => r.status !== "draft").length,
      rfqsInRouting: rfqs.filter(
        (r) =>
          r.status === "routing_in_progress" || r.status === "quotes_requested",
      ).length,
      jobsTotal: jobs.length,
      jobsInProduction: jobs.filter((j) => j.status === "in_production").length,
      jobsComplete: jobs.filter((j) => j.status === "complete").length,
    };
  } catch {
    return null;
  }
}
