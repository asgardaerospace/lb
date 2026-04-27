import { createServiceSupabase } from "@/lib/supabase/server";
import type {
  ConversionResult,
  MaterializedCustomerBundle,
  MaterializedCustomerProfile,
  MaterializedOrganization,
  MaterializedRoutingWeights,
  MaterializedSupplierFilters,
} from "./types";

export class ConversionError extends Error {
  constructor(
    message: string,
    public status: number = 409,
    public code?: string,
  ) {
    super(message);
  }
}

/**
 * Calls the SECURITY DEFINER `convert_customer_application` SQL function
 * to materialize the operational customer_profile + routing weights +
 * supplier filter for an approved customer application.
 *
 * Status guard:
 *   - The SQL function refuses to run unless application.status = 'approved'.
 *   - Postgres errcode 'P0001' (raise_exception) → 409.
 *   - Postgres errcode 'P0002' (no_data_found)   → 404.
 *
 * Idempotency:
 *   The SQL function UPSERTs the profile + child rows, but it also flips
 *   status to 'converted' which means re-runs against the same application
 *   raise — by design. Reset to 'approved' if you really want to re-run.
 */
export async function convertCustomerApplication(
  applicationId: string,
  adminUserId: string,
): Promise<ConversionResult> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.rpc("convert_customer_application", {
    p_application_id: applicationId,
    p_admin_user_id: adminUserId,
  });

  if (error) {
    const code = (error as { code?: string }).code;
    const message = error.message ?? "conversion failed";
    if (code === "P0002") {
      throw new ConversionError(message, 404, code);
    }
    if (code === "P0001") {
      throw new ConversionError(message, 409, code);
    }
    if (code === "23505") {
      // unique violation (most likely workspace_subdomain collision)
      throw new ConversionError(
        `Conversion conflict: ${message}. The chosen workspace subdomain is already taken.`,
        409,
        code,
      );
    }
    throw new ConversionError(message, 500, code);
  }

  if (!data || typeof data !== "object") {
    throw new ConversionError("conversion returned no result", 500);
  }

  // The SQL function returns jsonb. The Supabase client surfaces it as the
  // raw object on `data`.
  const r = data as Record<string, unknown>;
  return {
    profile_id: String(r.profile_id),
    organization_id: String(r.organization_id),
    application_id: String(r.application_id),
    status: (r.status as ConversionResult["status"]) ?? "converted",
    organization_created: Boolean(r.organization_created),
    profile_created: Boolean(r.profile_created),
    workspace_subdomain: String(r.workspace_subdomain ?? ""),
  };
}

/**
 * Fetch the materialized customer profile + routing weights + supplier
 * filter for a given application. Returns null if conversion has not run
 * yet (no profile row links back to the application).
 */
export async function getMaterializedBundleForApplication(
  applicationId: string,
): Promise<MaterializedCustomerBundle | null> {
  const supabase = createServiceSupabase();
  const profileRes = await supabase
    .from("customer_profiles")
    .select(
      "id, organization_id, source_application_id, tier, workspace_name, workspace_subdomain, data_residency, sso_provider, audit_log_retention_yrs, workspace_status, provisioned_at, created_at, updated_at",
    )
    .eq("source_application_id", applicationId)
    .maybeSingle();
  if (profileRes.error) {
    throw new Error(
      `customer_profiles fetch failed: ${profileRes.error.message}`,
    );
  }
  if (!profileRes.data) return null;

  const profile = profileRes.data as unknown as MaterializedCustomerProfile;

  const [orgRes, weightsRes, filtersRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, type, itar_registered, created_at")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("customer_routing_weights")
      .select(
        "id, customer_profile_id, cost_weight, speed_weight, risk_penalty_weight, geography_weight, preferred_regions, preferred_supplier_traits, updated_at",
      )
      .eq("customer_profile_id", profile.id)
      .maybeSingle(),
    supabase
      .from("customer_supplier_filters")
      .select("id, customer_profile_id, filter_expression, updated_at")
      .eq("customer_profile_id", profile.id)
      .maybeSingle(),
  ]);

  if (orgRes.error) {
    throw new Error(`organizations fetch failed: ${orgRes.error.message}`);
  }
  if (!orgRes.data) {
    throw new Error(
      `customer_profile ${profile.id} references missing organization ${profile.organization_id}`,
    );
  }
  if (weightsRes.error) {
    throw new Error(
      `customer_routing_weights fetch failed: ${weightsRes.error.message}`,
    );
  }
  if (filtersRes.error) {
    throw new Error(
      `customer_supplier_filters fetch failed: ${filtersRes.error.message}`,
    );
  }

  return {
    organization: orgRes.data as unknown as MaterializedOrganization,
    profile,
    routing_weights:
      (weightsRes.data as unknown as MaterializedRoutingWeights | null) ??
      null,
    supplier_filters:
      (filtersRes.data as unknown as MaterializedSupplierFilters | null) ??
      null,
  };
}
