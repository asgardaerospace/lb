import { randomUUID } from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  type SubmittedSupplierApplication,
  type SupplierApplicationDetail,
  type SupplierApplicationFull,
  type SupplierApplicationListRow,
  type SupplierApplicationPayload,
  type SupplierApplicationStatus,
  type SupplierApplicationSubmitInput,
  type SupplierReviewAction,
  SUPPLIER_REVIEW_ACTION_TO_STATUS,
  toIntegerOrNull,
  toIsoDateOrNull,
  toNumericOrNull,
} from "./types";

interface SubmitContext {
  authenticatedUserId?: string | null;
  authenticatedOrganizationId?: string | null;
}

/**
 * Insert a new supplier_applications row + child rows for the submitted
 * intake. Always uses the service-role client; the route layer is the
 * only thing enforcing access. RLS still gates direct PostgREST access
 * for non-admin reads.
 *
 * Best-effort transactional: parent goes first, children are batched
 * after. If any child insert fails the parent row stays in place
 * (status='submitted') — the JSONB snapshot is the source of truth.
 */
export async function submitSupplierApplication(
  input: SupplierApplicationSubmitInput,
  ctx: SubmitContext = {},
): Promise<SubmittedSupplierApplication> {
  const supabase = createServiceSupabase();
  const payload: SupplierApplicationPayload = input.payload;
  const company = payload.company;
  const compliance = payload.compliance;

  const headline = {
    organization_id: ctx.authenticatedOrganizationId ?? null,
    submitted_by: ctx.authenticatedUserId ?? null,
    intake_token: ctx.authenticatedUserId ? null : randomUUID(),
    intake_email: input.intake_email ?? null,
    status: "submitted" as const,
    version: 1,
    legal_name: company.legal_name,
    dba: company.dba ?? null,
    hq_country: company.hq_country ?? "US",
    hq_state: company.hq_state ?? null,
    hq_city: company.hq_city ?? null,
    team_size: toIntegerOrNull(company.team_size ?? null),
    year_founded: toIntegerOrNull(company.year_founded ?? null),
    duns: company.duns ?? null,
    cage: company.cage ?? null,
    itar_registered: !!compliance.itar_registered,
    cmmc_level: compliance.cmmc_level ?? "none",
    primary_processes: payload.primary_processes ?? [],
    payload: payload as unknown as Record<string, unknown>,
    payload_schema_version: input.payload_schema_version ?? 1,
    submitted_at: new Date().toISOString(),
  };

  const insertParent = await supabase
    .from("supplier_applications")
    .insert(headline)
    .select("id, status, legal_name")
    .single();

  if (insertParent.error || !insertParent.data) {
    throw new Error(
      `supplier_applications insert failed: ${
        insertParent.error?.message ?? "no row returned"
      }`,
    );
  }

  const applicationId = insertParent.data.id as string;

  // Child: certifications
  const certs = (payload.certifications ?? []).map((c) => ({
    application_id: applicationId,
    cert_type: c.cert_type,
    issuer: c.issuer ?? null,
    issued_date: toIsoDateOrNull(c.issued_date ?? null),
    expiration_date: toIsoDateOrNull(c.expiration_date ?? null),
    certificate_no: c.certificate_no ?? null,
  }));
  if (certs.length) {
    const r = await supabase
      .from("supplier_application_certifications")
      .insert(certs);
    if (r.error) {
      throw new Error(
        `supplier_application_certifications insert failed: ${r.error.message}`,
      );
    }
  }

  // Child: machines
  const machines = (payload.machines ?? []).map((m) => ({
    application_id: applicationId,
    machine_type: m.machine_type,
    manufacturer: m.manufacturer ?? null,
    model: m.model ?? null,
    envelope: m.envelope ?? null,
    axis_count: toIntegerOrNull(m.axis_count ?? null),
    tolerance_capability: m.tolerance_capability ?? null,
    materials_supported: m.materials_supported ?? [],
    count: toIntegerOrNull(m.count ?? null) ?? 1,
  }));
  if (machines.length) {
    const r = await supabase
      .from("supplier_application_machines")
      .insert(machines);
    if (r.error) {
      throw new Error(
        `supplier_application_machines insert failed: ${r.error.message}`,
      );
    }
  }

  // Child: capabilities
  const capabilities = (payload.capabilities ?? []).map((c) => ({
    application_id: applicationId,
    process_type: c.process_type,
    materials: c.materials ?? [],
    notes: c.notes ?? null,
  }));
  if (capabilities.length) {
    const r = await supabase
      .from("supplier_application_capabilities")
      .insert(capabilities);
    if (r.error) {
      throw new Error(
        `supplier_application_capabilities insert failed: ${r.error.message}`,
      );
    }
  }

  // Child: past_performance
  const pp = (payload.past_performance ?? []).map((p) => ({
    application_id: applicationId,
    customer_name: p.customer_name,
    program_name: p.program_name ?? null,
    contract_type: p.contract_type ?? null,
    year_start: toIntegerOrNull(p.year_start ?? null),
    year_end: toIntegerOrNull(p.year_end ?? null),
    contract_value_usd: toNumericOrNull(p.contract_value_usd ?? null),
    references_contact: p.references_contact ?? null,
  }));
  if (pp.length) {
    const r = await supabase
      .from("supplier_application_past_performance")
      .insert(pp);
    if (r.error) {
      throw new Error(
        `supplier_application_past_performance insert failed: ${r.error.message}`,
      );
    }
  }

  // Audit log — direct service-role insert (audit_logs.user_id is nullable).
  const auditRes = await supabase.from("audit_logs").insert({
    action: "supplier_application.submitted",
    entity_type: "supplier_application",
    entity_id: applicationId,
    user_id: ctx.authenticatedUserId ?? null,
    organization_id: ctx.authenticatedOrganizationId ?? null,
    metadata: {
      payload_schema_version: input.payload_schema_version ?? 1,
      anonymous: !ctx.authenticatedUserId,
      headline: {
        legal_name: headline.legal_name,
        itar_registered: headline.itar_registered,
        cmmc_level: headline.cmmc_level,
        primary_process_count: headline.primary_processes.length,
        cert_count: certs.length,
        machine_count: machines.length,
        capability_count: capabilities.length,
        past_performance_count: pp.length,
      },
    },
  });
  if (auditRes.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[supplier-application] audit insert failed:",
      auditRes.error.message,
    );
  }

  return {
    id: applicationId,
    status: insertParent.data.status as string,
    legal_name: insertParent.data.legal_name as string,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Admin reads
// ════════════════════════════════════════════════════════════════════════════

const LIST_COLUMNS = `
  id, status, legal_name, dba, hq_state, hq_country, itar_registered,
  cmmc_level, primary_processes, intake_email, submitted_at, reviewed_at,
  created_at
`;

export async function listSupplierApplications(): Promise<
  SupplierApplicationListRow[]
> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("supplier_applications")
    .select(LIST_COLUMNS)
    .neq("status", "draft")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`supplier_applications list failed: ${error.message}`);
  }
  return (data ?? []) as unknown as SupplierApplicationListRow[];
}

const DETAIL_COLUMNS = `
  id, status, legal_name, dba, hq_city, hq_state, hq_country,
  team_size, year_founded, duns, cage,
  itar_registered, cmmc_level, primary_processes,
  payload, payload_schema_version,
  intake_email, intake_token, organization_id,
  submitted_at, reviewed_at, reviewed_by, decision_notes, created_at
`;

export async function getSupplierApplicationFull(
  id: string,
): Promise<SupplierApplicationFull | null> {
  const supabase = createServiceSupabase();
  const appRes = await supabase
    .from("supplier_applications")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (appRes.error) {
    throw new Error(
      `supplier_applications detail fetch failed: ${appRes.error.message}`,
    );
  }
  if (!appRes.data) return null;
  const application = appRes.data as unknown as SupplierApplicationDetail;

  const [certRes, machineRes, capRes, ppRes, revRes] = await Promise.all([
    supabase
      .from("supplier_application_certifications")
      .select("id, cert_type, issuer, issued_date, expiration_date, certificate_no")
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("supplier_application_machines")
      .select(
        "id, machine_type, manufacturer, model, envelope, axis_count, tolerance_capability, materials_supported, count",
      )
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("supplier_application_capabilities")
      .select("id, process_type, materials, notes")
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("supplier_application_past_performance")
      .select(
        "id, customer_name, program_name, contract_type, year_start, year_end, contract_value_usd, references_contact",
      )
      .eq("application_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("supplier_application_reviews")
      .select("id, reviewer_id, action, notes, metadata, created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);

  for (const [label, res] of Object.entries({
    certifications: certRes,
    machines: machineRes,
    capabilities: capRes,
    past_performance: ppRes,
    reviews: revRes,
  })) {
    if (res.error) {
      throw new Error(
        `supplier_application_${label} fetch failed: ${res.error.message}`,
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
    certifications: (certRes.data ?? []) as SupplierApplicationFull["certifications"],
    machines: (machineRes.data ?? []) as SupplierApplicationFull["machines"],
    capabilities: (capRes.data ?? []) as SupplierApplicationFull["capabilities"],
    past_performance: (ppRes.data ?? []) as SupplierApplicationFull["past_performance"],
    reviews,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Status transitions (admin-only)
// ════════════════════════════════════════════════════════════════════════════

const ALLOWED_FROM: Record<SupplierReviewAction, SupplierApplicationStatus[]> = {
  mark_under_review: ["submitted"],
  request_info: ["submitted", "under_review"],
  approve: ["submitted", "under_review"],
  reject: ["submitted", "under_review"],
};

export class SupplierTransitionError extends Error {
  constructor(
    message: string,
    public status: number = 409,
  ) {
    super(message);
  }
}

export interface SupplierTransitionOptions {
  reviewerId: string;
  reviewerOrganizationId: string;
  notes?: string | null;
}

export interface SupplierTransitionResult {
  id: string;
  status: SupplierApplicationStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export async function transitionSupplierApplication(
  id: string,
  action: SupplierReviewAction,
  opts: SupplierTransitionOptions,
): Promise<SupplierTransitionResult> {
  const supabase = createServiceSupabase();

  const cur = await supabase
    .from("supplier_applications")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (cur.error) {
    throw new Error(`supplier_applications lookup failed: ${cur.error.message}`);
  }
  if (!cur.data) {
    throw new SupplierTransitionError("Application not found", 404);
  }
  const current = cur.data as { id: string; status: SupplierApplicationStatus };

  const allowed = ALLOWED_FROM[action];
  if (!allowed.includes(current.status)) {
    throw new SupplierTransitionError(
      `Action '${action}' is not allowed from status '${current.status}'`,
      409,
    );
  }

  const next = SUPPLIER_REVIEW_ACTION_TO_STATUS[action];
  const reviewedAt = new Date().toISOString();
  const trimmedNotes = opts.notes?.trim() || null;

  const upd = await supabase
    .from("supplier_applications")
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
      `supplier_applications update failed: ${
        upd.error?.message ?? "no row returned"
      }`,
    );
  }

  const reviewIns = await supabase
    .from("supplier_application_reviews")
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
      `supplier_application_reviews insert failed: ${reviewIns.error.message}`,
    );
  }

  const baseAudit = {
    entity_type: "supplier_application",
    entity_id: id,
    user_id: opts.reviewerId,
    organization_id: opts.reviewerOrganizationId,
  };
  const auditRows = [
    {
      ...baseAudit,
      action: "supplier_application.reviewed",
      metadata: { review_action: action, has_notes: !!trimmedNotes },
    },
    {
      ...baseAudit,
      action: "supplier_application.status_changed",
      metadata: { from: current.status, to: next, review_action: action },
    },
  ];
  const auditRes = await supabase.from("audit_logs").insert(auditRows);
  if (auditRes.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[supplier-application] audit insert failed:",
      auditRes.error.message,
    );
  }

  return {
    id: upd.data.id as string,
    status: upd.data.status as SupplierApplicationStatus,
    reviewed_at: upd.data.reviewed_at as string | null,
    reviewed_by: upd.data.reviewed_by as string | null,
  };
}
