import { createServiceSupabase } from "@/lib/supabase/server";
import type {
  MaterializedOperationalCapability,
  MaterializedOperationalCertification,
  MaterializedOperationalMachine,
  MaterializedSupplierBundle,
  MaterializedSupplierOrganization,
  MaterializedSupplierProfile,
  SupplierConversionResult,
} from "./types";

export class SupplierConversionError extends Error {
  constructor(
    message: string,
    public status: number = 409,
    public code?: string,
  ) {
    super(message);
  }
}

/**
 * Calls the SECURITY DEFINER `convert_supplier_application` SQL function
 * to materialize the operational supplier_profile + certifications +
 * machines + capabilities for an approved supplier application.
 *
 * Status guard:
 *   - SQL refuses to run unless application.status = 'approved'.
 *   - Postgres errcode 'P0001' (raise_exception) → 409.
 *   - Postgres errcode 'P0002' (no_data_found)   → 404.
 *
 * Idempotency:
 *   The SQL function UPSERTs the profile and delete-then-inserts the
 *   child rows, but it also flips status to 'converted' which means
 *   re-runs against the same application raise — by design.
 */
export async function convertSupplierApplication(
  applicationId: string,
  adminUserId: string,
): Promise<SupplierConversionResult> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.rpc("convert_supplier_application", {
    p_application_id: applicationId,
    p_admin_user_id: adminUserId,
  });

  if (error) {
    const code = (error as { code?: string }).code;
    const message = error.message ?? "conversion failed";
    if (code === "P0002") {
      throw new SupplierConversionError(message, 404, code);
    }
    if (code === "P0001") {
      throw new SupplierConversionError(message, 409, code);
    }
    if (code === "23505") {
      throw new SupplierConversionError(
        `Conversion conflict: ${message}.`,
        409,
        code,
      );
    }
    throw new SupplierConversionError(message, 500, code);
  }

  if (!data || typeof data !== "object") {
    throw new SupplierConversionError("conversion returned no result", 500);
  }

  const r = data as Record<string, unknown>;
  return {
    profile_id: String(r.profile_id),
    organization_id: String(r.organization_id),
    application_id: String(r.application_id),
    status: (r.status as SupplierConversionResult["status"]) ?? "converted",
    organization_created: Boolean(r.organization_created),
    profile_created: Boolean(r.profile_created),
    cert_count: Number(r.cert_count ?? 0),
    machine_count: Number(r.machine_count ?? 0),
    capability_count: Number(r.capability_count ?? 0),
  };
}

/**
 * Fetch the materialized supplier bundle for a given application: the
 * supplier_profile + organization + operational certifications, machines,
 * and capabilities. Returns null if conversion has not run yet.
 */
export async function getMaterializedSupplierBundleForApplication(
  applicationId: string,
): Promise<MaterializedSupplierBundle | null> {
  const supabase = createServiceSupabase();
  const profileRes = await supabase
    .from("supplier_profiles")
    .select(
      "id, organization_id, source_application_id, approval_status, company_summary, facility_size_sqft, employee_count, quality_system_notes, capacity_notes, as9100_certified, iso9001_certified, itar_registered, cmmc_status, submitted_at, reviewed_at, review_notes, created_at, updated_at",
    )
    .eq("source_application_id", applicationId)
    .maybeSingle();
  if (profileRes.error) {
    throw new Error(
      `supplier_profiles fetch failed: ${profileRes.error.message}`,
    );
  }
  if (!profileRes.data) return null;

  const profile = profileRes.data as unknown as MaterializedSupplierProfile;

  const [orgRes, certRes, machineRes, capRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, type, itar_registered, created_at")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("certifications")
      .select("id, type, expiration_date, verification_status")
      .eq("organization_id", profile.organization_id)
      .order("type", { ascending: true }),
    supabase
      .from("machines")
      .select("id, machine_type, materials_supported, capacity")
      .eq("organization_id", profile.organization_id)
      .order("machine_type", { ascending: true }),
    supabase
      .from("capabilities")
      .select("id, process_type, materials_supported")
      .eq("organization_id", profile.organization_id)
      .order("process_type", { ascending: true }),
  ]);

  if (orgRes.error) {
    throw new Error(`organizations fetch failed: ${orgRes.error.message}`);
  }
  if (!orgRes.data) {
    throw new Error(
      `supplier_profile ${profile.id} references missing organization ${profile.organization_id}`,
    );
  }
  if (certRes.error) {
    throw new Error(`certifications fetch failed: ${certRes.error.message}`);
  }
  if (machineRes.error) {
    throw new Error(`machines fetch failed: ${machineRes.error.message}`);
  }
  if (capRes.error) {
    throw new Error(`capabilities fetch failed: ${capRes.error.message}`);
  }

  return {
    organization: orgRes.data as unknown as MaterializedSupplierOrganization,
    profile,
    certifications:
      (certRes.data as unknown as MaterializedOperationalCertification[]) ??
      [],
    machines:
      (machineRes.data as unknown as MaterializedOperationalMachine[]) ?? [],
    capabilities:
      (capRes.data as unknown as MaterializedOperationalCapability[]) ?? [],
  };
}
