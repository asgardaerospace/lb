import { createServerSupabase } from "@/lib/supabase/server";
import type {
  CandidateSupplier,
  RoutingDecision,
  RoutingDecisionCreate,
  WorkPackage,
  WorkPackageCreate,
} from "@/lib/routing/types";
import type { Part } from "@/lib/rfq/types";

const WP_COLUMNS =
  "id, rfq_id, package_name, package_type, description, status, created_at, updated_at, created_by";

const RD_COLUMNS =
  "id, work_package_id, supplier_organization_id, capability_fit_score, capacity_fit_score, compliance_fit_score, schedule_fit_score, routing_rationale, routing_status, quote_requested_at, created_at, updated_at, created_by";

// ---------- work_packages ----------

export async function createWorkPackage(
  rfqId: string,
  userId: string,
  input: WorkPackageCreate,
): Promise<WorkPackage> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("work_packages")
    .insert({
      rfq_id: rfqId,
      created_by: userId,
      package_name: input.package_name,
      package_type: input.package_type ?? null,
      description: input.description ?? null,
    })
    .select(WP_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkPackage;
}

export async function listWorkPackagesForRfq(
  rfqId: string,
): Promise<WorkPackage[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("work_packages")
    .select(WP_COLUMNS)
    .eq("rfq_id", rfqId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkPackage[];
}

export async function getWorkPackageById(
  id: string,
): Promise<WorkPackage | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("work_packages")
    .select(WP_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkPackage | null) ?? null;
}

export async function setWorkPackageStatus(
  id: string,
  status: "open" | "routed",
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("work_packages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- work_package_parts ----------

export async function attachPart(
  workPackageId: string,
  partId: string,
  userId: string,
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("work_package_parts")
    .insert({
      work_package_id: workPackageId,
      part_id: partId,
      created_by: userId,
    });
  if (error) throw new Error(error.message);
}

export async function detachPart(
  workPackageId: string,
  partId: string,
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("work_package_parts")
    .delete()
    .eq("work_package_id", workPackageId)
    .eq("part_id", partId);
  if (error) throw new Error(error.message);
}

export async function listPartsForWorkPackage(
  workPackageId: string,
): Promise<Part[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("work_package_parts")
    .select(
      "part_id, parts(id, rfq_id, part_number, part_name, revision, material, process_required, quantity, tolerance_notes, finish_requirements, inspection_requirements, created_at, updated_at, created_by)",
    )
    .eq("work_package_id", workPackageId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<{
    parts: Part | Part[] | null;
  }>;
  const out: Part[] = [];
  for (const r of rows) {
    if (!r.parts) continue;
    if (Array.isArray(r.parts)) {
      out.push(...r.parts);
    } else {
      out.push(r.parts);
    }
  }
  return out;
}

// ---------- routing_decisions ----------

export async function createRoutingDecision(
  workPackageId: string,
  userId: string,
  input: RoutingDecisionCreate,
): Promise<RoutingDecision> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("routing_decisions")
    .insert({
      work_package_id: workPackageId,
      supplier_organization_id: input.supplier_organization_id,
      capability_fit_score: input.capability_fit_score ?? null,
      capacity_fit_score: input.capacity_fit_score ?? null,
      compliance_fit_score: input.compliance_fit_score ?? null,
      schedule_fit_score: input.schedule_fit_score ?? null,
      routing_rationale: input.routing_rationale ?? null,
      created_by: userId,
    })
    .select(RD_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as RoutingDecision;
}

export async function listRoutingDecisionsForWorkPackage(
  workPackageId: string,
): Promise<RoutingDecision[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("routing_decisions")
    .select(RD_COLUMNS)
    .eq("work_package_id", workPackageId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoutingDecision[];
}

export async function getRoutingDecisionById(
  id: string,
): Promise<RoutingDecision | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("routing_decisions")
    .select(RD_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as RoutingDecision | null) ?? null;
}

export async function markQuoteRequested(
  id: string,
): Promise<RoutingDecision> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("routing_decisions")
    .update({
      routing_status: "quote_requested",
      quote_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(RD_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as RoutingDecision;
}

// ---------- rfq status transitions driven by routing ----------
// The rfq_status enum was extended in 0003_routing.sql with
// `routing_in_progress` and `quotes_requested`. The RFQ module's TypeScript
// type stays narrow (draft | submitted) per task scoping; this helper writes
// the new values directly without touching the rfq module.

export async function transitionRfqStatus(
  rfqId: string,
  next: "routing_in_progress" | "quotes_requested",
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("rfqs")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("id", rfqId);
  if (error) throw new Error(error.message);
}

export async function getRfqStatus(rfqId: string): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .select("status")
    .eq("id", rfqId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { status: string } | null)?.status ?? null;
}

// ---------- candidate suppliers ----------

export async function listCandidateSuppliers(): Promise<CandidateSupplier[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("supplier_profiles")
    .select(
      "organization_id, approval_status, as9100_certified, iso9001_certified, itar_registered, cmmc_status, capacity_notes, organizations(name)",
    )
    .eq("approval_status", "approved");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<{
    organization_id: string;
    approval_status: string;
    as9100_certified: boolean;
    iso9001_certified: boolean;
    itar_registered: boolean;
    cmmc_status: string;
    capacity_notes: string | null;
    organizations: { name: string } | { name: string }[] | null;
  }>;
  return rows.map((r) => {
    const org = Array.isArray(r.organizations)
      ? r.organizations[0]
      : r.organizations;
    return {
      organization_id: r.organization_id,
      organization_name: org?.name ?? "(unknown)",
      approval_status: r.approval_status,
      as9100_certified: r.as9100_certified,
      iso9001_certified: r.iso9001_certified,
      itar_registered: r.itar_registered,
      cmmc_status: r.cmmc_status,
      capacity_notes: r.capacity_notes,
    };
  });
}

// ---------- supplier inbox ----------

export interface SupplierQuoteRequest {
  routing_decision_id: string;
  work_package_id: string;
  quote_requested_at: string | null;
  rfq_title: string;
  rfq_description: string | null;
  rfq_required_delivery_date: string | null;
  rfq_priority: string;
  parts: Part[];
}

// Returns only the caller-supplier's quote requests. Does not expose the
// work package's rationale, other routing decisions, or competitor identities.
export async function listQuoteRequestsForSupplier(
  supplierOrgId: string,
): Promise<SupplierQuoteRequest[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("routing_decisions")
    .select(
      `id, work_package_id, quote_requested_at,
       work_packages!inner(
         id,
         rfqs!inner(rfq_title, description, required_delivery_date, priority)
       )`,
    )
    .eq("supplier_organization_id", supplierOrgId)
    .eq("routing_status", "quote_requested")
    .order("quote_requested_at", {
      ascending: false,
      nullsFirst: false,
    });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    work_package_id: string;
    quote_requested_at: string | null;
    work_packages: {
      id: string;
      rfqs: {
        rfq_title: string;
        description: string | null;
        required_delivery_date: string | null;
        priority: string;
      };
    };
  }>;

  const results: SupplierQuoteRequest[] = [];
  for (const row of rows) {
    const parts = await listPartsForWorkPackage(row.work_package_id);
    results.push({
      routing_decision_id: row.id,
      work_package_id: row.work_package_id,
      quote_requested_at: row.quote_requested_at,
      rfq_title: row.work_packages.rfqs.rfq_title,
      rfq_description: row.work_packages.rfqs.description,
      rfq_required_delivery_date: row.work_packages.rfqs.required_delivery_date,
      rfq_priority: row.work_packages.rfqs.priority,
      parts,
    });
  }
  return results;
}
