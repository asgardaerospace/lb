import { randomUUID } from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  type CustomerApplicationPayload,
  type CustomerApplicationSubmitInput,
  type SubmittedCustomerApplication,
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
