import { randomUUID } from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  type SubmittedSupplierApplication,
  type SupplierApplicationPayload,
  type SupplierApplicationSubmitInput,
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
