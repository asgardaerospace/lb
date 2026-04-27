import { randomUUID } from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  type CustomerApplicationDetail,
  type CustomerApplicationFull,
  type CustomerApplicationListRow,
  type CustomerApplicationPayload,
  type CustomerApplicationStatus,
  type CustomerApplicationSubmitInput,
  type ReviewAction,
  type SubmittedCustomerApplication,
  REVIEW_ACTION_TO_STATUS,
  deriveCustomerTier,
  toIntegerOrNull,
} from "./types";

interface SubmitContext {
  // When the request was made by an authenticated buyer:
  authenticatedUserId?: string | null;
  authenticatedOrganizationId?: string | null;
}

/**
 * Insert a new customer_applications row + child rows for the submitted
 * intake. Always uses the service-role client so the route layer is the
 * only thing enforcing access. RLS still gates direct PostgREST access
 * for non-admin users.
 *
 * The insert is "best-effort transactional": parent goes first, children
 * are inserted in batches. If any child insert fails we leave the parent
 * row in place (status='submitted') and surface the error — better than a
 * silent rollback that loses the snapshot. The full payload always lands
 * in the `payload` JSONB column even if children fail.
 */
export async function submitCustomerApplication(
  input: CustomerApplicationSubmitInput,
  ctx: SubmitContext = {},
): Promise<SubmittedCustomerApplication> {
  const supabase = createServiceSupabase();
  const payload: CustomerApplicationPayload = input.payload;
  const company = payload.company;
  const compliance = payload.compliance;
  const programChars = payload.program_chars;
  const supplyChain = payload.supply_chain;
  const workspace = payload.workspace;

  const tier = deriveCustomerTier(payload);

  // Extract headline columns from the payload. Anything missing/invalid
  // becomes null — the JSONB snapshot is the source of truth.
  const headline = {
    organization_id: ctx.authenticatedOrganizationId ?? null,
    submitted_by: ctx.authenticatedUserId ?? null,
    intake_token: ctx.authenticatedUserId ? null : randomUUID(),
    intake_email: input.intake_email ?? null,
    status: "submitted" as const,
    version: 1,
    legal_name: company.legal_name,
    dba: company.dba ?? null,
    website: company.website ?? null,
    hq_country: company.hq_country ?? "US",
    hq_state: company.hq_state ?? null,
    hq_city: company.hq_city ?? null,
    team_size: toIntegerOrNull(company.team_size ?? null),
    org_type: company.org_type ?? null,
    funding_stage: company.funding_stage ?? null,
    itar: !!compliance.itar,
    cui: !!compliance.cui,
    as9100: !!compliance.as9100,
    nadcap: !!compliance.nadcap,
    defense_program: !!compliance.defense_program,
    cmmc_level: compliance.cmmc_required_level ?? "none",
    geography: supplyChain.geography ?? "domestic_only",
    cost_vs_speed: clampToByte(programChars.cost_vs_speed ?? 50),
    risk_tolerance: programChars.risk_tolerance ?? null,
    suppliers_per_part: clampToByte(
      Number(supplyChain.preferred_supplier_count_per_part ?? 2),
    ),
    typical_lead_time_weeks: toIntegerOrNull(programChars.typical_lead_time_weeks),
    lead_time_tolerance: programChars.lead_time_tolerance ?? null,
    first_use_action: payload.first_use.action ?? null,
    derived_tier: tier,
    workspace_name: workspace.workspace_name ?? null,
    workspace_subdomain: workspace.subdomain ?? null,
    data_residency: workspace.data_residency ?? null,
    sso_provider: workspace.sso_provider ?? null,
    initial_seats: toIntegerOrNull(workspace.seats),
    payload: payload as unknown as Record<string, unknown>,
    payload_schema_version: input.payload_schema_version ?? 1,
    submitted_at: new Date().toISOString(),
  };

  const insertParent = await supabase
    .from("customer_applications")
    .insert(headline)
    .select("id, status, derived_tier")
    .single();

  if (insertParent.error || !insertParent.data) {
    throw new Error(
      `customer_applications insert failed: ${insertParent.error?.message ?? "no row returned"}`,
    );
  }

  const applicationId = insertParent.data.id as string;

  // Children — best-effort. If a batch fails we throw so the route returns
  // 500 with the underlying message; the parent row remains for forensics.
  const programs = (payload.programs?.types ?? [])
    .filter((t) => t.on)
    .map((t) => ({
      application_id: applicationId,
      program_category: t.id,
      stage: t.stage ?? "concept",
      annual_volume: toIntegerOrNull(t.annual_volume ?? null),
      notes: t.notes ?? null,
    }));
  if (programs.length) {
    const r = await supabase.from("customer_application_programs").insert(programs);
    if (r.error) {
      throw new Error(`customer_application_programs insert failed: ${r.error.message}`);
    }
  }

  const processes = (payload.manufacturing?.processes ?? []).map((p: string) => ({
    application_id: applicationId,
    process_type: p,
  }));
  if (processes.length) {
    const r = await supabase
      .from("customer_application_processes")
      .insert(processes);
    if (r.error) {
      throw new Error(
        `customer_application_processes insert failed: ${r.error.message}`,
      );
    }
  }

  const contacts = (company.contacts ?? []).map((c) => ({
    application_id: applicationId,
    role: c.role,
    name: c.name,
    title: c.title ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
  }));
  if (contacts.length) {
    const r = await supabase
      .from("customer_application_contacts")
      .insert(contacts);
    if (r.error) {
      throw new Error(
        `customer_application_contacts insert failed: ${r.error.message}`,
      );
    }
  }

  if (compliance.defense_program && (compliance.defense_program_names?.length ?? 0) > 0) {
    const defenseRows = compliance.defense_program_names.map((name: string) => ({
      application_id: applicationId,
      program_name: name,
    }));
    const r = await supabase
      .from("customer_application_defense_programs")
      .insert(defenseRows);
    if (r.error) {
      throw new Error(
        `customer_application_defense_programs insert failed: ${r.error.message}`,
      );
    }
  }

  // Audit log — direct service-role insert so we can write with NULL user_id
  // for anonymous submissions (the typed logAuditEvent helper requires a
  // non-null user_id). audit_logs.user_id is nullable per migration 0001.
  const auditRes = await supabase.from("audit_logs").insert({
    action: "customer_application.submitted",
    entity_type: "customer_application",
    entity_id: applicationId,
    user_id: ctx.authenticatedUserId ?? null,
    organization_id: ctx.authenticatedOrganizationId ?? null,
    metadata: {
      derived_tier: tier,
      payload_schema_version: input.payload_schema_version ?? 1,
      anonymous: !ctx.authenticatedUserId,
      headline: {
        legal_name: headline.legal_name,
        org_type: headline.org_type,
        itar: headline.itar,
        defense_program: headline.defense_program,
      },
    },
  });
  if (auditRes.error && process.env.NODE_ENV !== "production") {
    console.warn("[customer-application] audit insert failed:", auditRes.error.message);
  }

  return {
    id: applicationId,
    status: insertParent.data.status as string,
    derived_tier: insertParent.data.derived_tier as string | null,
  };
}

function clampToByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ════════════════════════════════════════════════════════════════════════════
// Admin reads
// ════════════════════════════════════════════════════════════════════════════

const LIST_COLUMNS = `
  id, status, legal_name, dba, hq_state, hq_country, org_type, derived_tier,
  itar, defense_program, intake_email, submitted_at, reviewed_at, created_at
`;

export async function listCustomerApplications(): Promise<
  CustomerApplicationListRow[]
> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("customer_applications")
    .select(LIST_COLUMNS)
    .neq("status", "draft")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`customer_applications list failed: ${error.message}`);
  }
  return (data ?? []) as unknown as CustomerApplicationListRow[];
}

const DETAIL_COLUMNS = `
  id, status, legal_name, dba, website, hq_city, hq_state, hq_country,
  team_size, org_type, funding_stage, derived_tier,
  itar, cui, as9100, nadcap, defense_program, cmmc_level,
  geography, cost_vs_speed, risk_tolerance, suppliers_per_part,
  typical_lead_time_weeks, lead_time_tolerance, first_use_action,
  workspace_name, workspace_subdomain, data_residency, sso_provider,
  initial_seats, payload, payload_schema_version,
  intake_email, intake_token, organization_id,
  submitted_at, reviewed_at, reviewed_by, decision_notes, created_at
`;

export async function getCustomerApplicationFull(
  id: string,
): Promise<CustomerApplicationFull | null> {
  const supabase = createServiceSupabase();
  const appRes = await supabase
    .from("customer_applications")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (appRes.error) {
    throw new Error(
      `customer_applications detail fetch failed: ${appRes.error.message}`,
    );
  }
  if (!appRes.data) return null;
  const application = appRes.data as unknown as CustomerApplicationDetail;

  const [progRes, procRes, contactRes, defRes, revRes] = await Promise.all([
    supabase
      .from("customer_application_programs")
      .select("id, program_category, stage, annual_volume, notes")
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("customer_application_processes")
      .select("id, process_type")
      .eq("application_id", id)
      .order("process_type", { ascending: true }),
    supabase
      .from("customer_application_contacts")
      .select("id, role, name, title, email, phone")
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("customer_application_defense_programs")
      .select(
        "id, program_name, prime_contractor, contract_vehicle, dpas_rating, far_clauses, notes",
      )
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("customer_application_reviews")
      .select("id, reviewer_id, action, notes, metadata, created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);

  for (const [label, res] of Object.entries({
    programs: progRes,
    processes: procRes,
    contacts: contactRes,
    defense_programs: defRes,
    reviews: revRes,
  })) {
    if (res.error) {
      throw new Error(
        `customer_application_${label} fetch failed: ${res.error.message}`,
      );
    }
  }

  const reviewerIds = Array.from(
    new Set(
      (revRes.data ?? [])
        .map((r) => (r as { reviewer_id: string }).reviewer_id)
        .filter(Boolean),
    ),
  );
  let reviewerEmail = new Map<string, string>();
  if (reviewerIds.length) {
    const usersRes = await supabase
      .from("users")
      .select("id, email")
      .in("id", reviewerIds);
    if (!usersRes.error && usersRes.data) {
      reviewerEmail = new Map(
        (usersRes.data as { id: string; email: string }[]).map((u) => [
          u.id,
          u.email,
        ]),
      );
    }
  }

  const reviews = (
    (revRes.data ?? []) as unknown as Array<{
      id: string;
      reviewer_id: string;
      action: string;
      notes: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>
  ).map((r) => ({
    ...r,
    reviewer_email: reviewerEmail.get(r.reviewer_id) ?? null,
  }));

  return {
    application,
    programs: (progRes.data ?? []) as CustomerApplicationFull["programs"],
    processes: (procRes.data ?? []) as CustomerApplicationFull["processes"],
    contacts: (contactRes.data ?? []) as CustomerApplicationFull["contacts"],
    defense_programs: (defRes.data ?? []) as CustomerApplicationFull["defense_programs"],
    reviews,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Status transitions (admin-only)
// ════════════════════════════════════════════════════════════════════════════

const ALLOWED_FROM: Record<ReviewAction, CustomerApplicationStatus[]> = {
  mark_under_review: ["submitted"],
  request_info: ["submitted", "under_review"],
  approve: ["submitted", "under_review"],
  reject: ["submitted", "under_review"],
};

export class TransitionError extends Error {
  constructor(
    message: string,
    public status: number = 409,
  ) {
    super(message);
  }
}

export interface TransitionOptions {
  reviewerId: string;
  reviewerOrganizationId: string;
  notes?: string | null;
}

export interface TransitionResult {
  id: string;
  status: CustomerApplicationStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export async function transitionCustomerApplication(
  id: string,
  action: ReviewAction,
  opts: TransitionOptions,
): Promise<TransitionResult> {
  const supabase = createServiceSupabase();

  const cur = await supabase
    .from("customer_applications")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (cur.error) {
    throw new Error(`customer_applications lookup failed: ${cur.error.message}`);
  }
  if (!cur.data) {
    throw new TransitionError("Application not found", 404);
  }
  const current = cur.data as { id: string; status: CustomerApplicationStatus };

  const allowed = ALLOWED_FROM[action];
  if (!allowed.includes(current.status)) {
    throw new TransitionError(
      `Action '${action}' is not allowed from status '${current.status}'`,
      409,
    );
  }

  const next = REVIEW_ACTION_TO_STATUS[action];
  const reviewedAt = new Date().toISOString();
  const trimmedNotes = opts.notes?.trim() || null;

  const upd = await supabase
    .from("customer_applications")
    .update({
      status: next,
      reviewed_at: reviewedAt,
      reviewed_by: opts.reviewerId,
      decision_notes: trimmedNotes ?? null,
    })
    .eq("id", id)
    .select("id, status, reviewed_at, reviewed_by")
    .single();
  if (upd.error || !upd.data) {
    throw new Error(
      `customer_applications update failed: ${
        upd.error?.message ?? "no row returned"
      }`,
    );
  }

  const reviewIns = await supabase
    .from("customer_application_reviews")
    .insert({
      application_id: id,
      reviewer_id: opts.reviewerId,
      action,
      notes: trimmedNotes,
      metadata: {
        prior_status: current.status,
        new_status: next,
      },
    });
  if (reviewIns.error) {
    throw new Error(
      `customer_application_reviews insert failed: ${reviewIns.error.message}`,
    );
  }

  const baseAudit = {
    entity_type: "customer_application",
    entity_id: id,
    user_id: opts.reviewerId,
    organization_id: opts.reviewerOrganizationId,
  };
  const auditRows = [
    {
      ...baseAudit,
      action: "customer_application.reviewed",
      metadata: { review_action: action, has_notes: !!trimmedNotes },
    },
    {
      ...baseAudit,
      action: "customer_application.status_changed",
      metadata: { from: current.status, to: next, review_action: action },
    },
  ];
  const auditRes = await supabase.from("audit_logs").insert(auditRows);
  if (auditRes.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[customer-application] audit insert failed:",
      auditRes.error.message,
    );
  }

  return {
    id: upd.data.id as string,
    status: upd.data.status as CustomerApplicationStatus,
    reviewed_at: upd.data.reviewed_at as string | null,
    reviewed_by: upd.data.reviewed_by as string | null,
  };
}
