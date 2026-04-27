import { createServiceSupabase } from "@/lib/supabase/server";
import { getCustomerApplicationFull } from "./repository";
import {
  SCORING_MODEL_KEY,
  SCORING_MODEL_VERSION,
  SCORING_WEIGHTS,
  scoreCustomerApplication,
  type DimensionKey,
  type DerivedPriority,
} from "./scoring";

export interface StoredFitScore {
  id: string;
  application_id: string;
  model_id: string;
  composite_score: number;
  dimensions: Record<string, number>;
  derived_priority: DerivedPriority | null;
  computed_at: string;
  computed_by: string | null;
  model_version: number;
}

interface ComputeOptions {
  computedBy?: string | null;
}

/**
 * Idempotently ensures the v2 customer_fit scoring model exists in
 * scoring_models. Returns its uuid. Safe to call from any code path.
 */
export async function ensureFitModelV2(): Promise<string> {
  const supabase = createServiceSupabase();
  const existing = await supabase
    .from("scoring_models")
    .select("id")
    .eq("kind", SCORING_MODEL_KEY)
    .eq("version", SCORING_MODEL_VERSION)
    .maybeSingle();
  if (existing.error) {
    throw new Error(
      `scoring_models lookup failed: ${existing.error.message}`,
    );
  }
  if (existing.data?.id) return existing.data.id as string;

  const ins = await supabase
    .from("scoring_models")
    .insert({
      kind: SCORING_MODEL_KEY,
      version: SCORING_MODEL_VERSION,
      active: true,
      weights: SCORING_WEIGHTS,
      description:
        "Customer fit v2 — six dimensions: compliance complexity, manufacturing fit, program maturity, production volume, data readiness, strategic fit. Composite is weighted average; priority bands per the design rationale (P0 ≥85, P1 70-84, P2 55-69, review <55).",
    })
    .select("id")
    .single();
  if (ins.error || !ins.data) {
    // Possible race: another caller inserted concurrently. Re-read.
    const reread = await supabase
      .from("scoring_models")
      .select("id")
      .eq("kind", SCORING_MODEL_KEY)
      .eq("version", SCORING_MODEL_VERSION)
      .maybeSingle();
    if (reread.data?.id) return reread.data.id as string;
    throw new Error(
      `scoring_models insert failed: ${ins.error?.message ?? "no row"}`,
    );
  }
  return ins.data.id as string;
}

/**
 * Compute a fresh fit score for an application and UPSERT into
 * customer_fit_scores. Writes an audit log row on success.
 *
 * Idempotent: re-running for the same (application, model) pair updates
 * the existing row and writes a new audit entry.
 */
export async function computeAndStoreFitScore(
  applicationId: string,
  opts: ComputeOptions = {},
): Promise<StoredFitScore> {
  const full = await getCustomerApplicationFull(applicationId);
  if (!full) {
    throw new Error(`application not found: ${applicationId}`);
  }

  const result = scoreCustomerApplication(full);
  const modelId = await ensureFitModelV2();
  const supabase = createServiceSupabase();

  const dimensionsForStorage: Record<string, number> = {};
  for (const d of result.dimensions) {
    dimensionsForStorage[d.key] = d.score;
  }

  const computedAt = new Date().toISOString();
  const upsert = await supabase
    .from("customer_fit_scores")
    .upsert(
      {
        application_id: applicationId,
        model_id: modelId,
        composite_score: result.composite,
        dimensions: dimensionsForStorage,
        derived_priority: result.priority,
        computed_at: computedAt,
        computed_by: opts.computedBy ?? null,
      },
      { onConflict: "application_id,model_id" },
    )
    .select(
      "id, application_id, model_id, composite_score, dimensions, derived_priority, computed_at, computed_by",
    )
    .single();
  if (upsert.error || !upsert.data) {
    throw new Error(
      `customer_fit_scores upsert failed: ${
        upsert.error?.message ?? "no row returned"
      }`,
    );
  }

  const auditRes = await supabase.from("audit_logs").insert({
    action: "customer_application.scored",
    entity_type: "customer_application",
    entity_id: applicationId,
    user_id: opts.computedBy ?? null,
    organization_id: full.application.organization_id ?? null,
    metadata: {
      model_kind: SCORING_MODEL_KEY,
      model_version: SCORING_MODEL_VERSION,
      composite: result.composite,
      priority: result.priority,
      dimensions: dimensionsForStorage,
      risk_flag_count: result.riskFlags.length,
    },
  });
  if (auditRes.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[customer-application.scoring] audit insert failed:",
      auditRes.error.message,
    );
  }

  return {
    id: upsert.data.id as string,
    application_id: upsert.data.application_id as string,
    model_id: upsert.data.model_id as string,
    composite_score: upsert.data.composite_score as number,
    dimensions: upsert.data.dimensions as Record<string, number>,
    derived_priority: upsert.data.derived_priority as DerivedPriority | null,
    computed_at: upsert.data.computed_at as string,
    computed_by: upsert.data.computed_by as string | null,
    model_version: SCORING_MODEL_VERSION,
  };
}

/**
 * Read the latest fit score for a single application (latest model version
 * for the configured kind).
 */
export async function getLatestFitScore(
  applicationId: string,
): Promise<StoredFitScore | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("customer_fit_scores")
    .select(
      "id, application_id, model_id, composite_score, dimensions, derived_priority, computed_at, computed_by",
    )
    .eq("application_id", applicationId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`customer_fit_scores fetch failed: ${error.message}`);
  }
  if (!data) return null;
  return {
    id: data.id as string,
    application_id: data.application_id as string,
    model_id: data.model_id as string,
    composite_score: data.composite_score as number,
    dimensions: data.dimensions as Record<string, number>,
    derived_priority: data.derived_priority as DerivedPriority | null,
    computed_at: data.computed_at as string,
    computed_by: data.computed_by as string | null,
    model_version: SCORING_MODEL_VERSION,
  };
}

/**
 * Bulk-fetch the latest score per application for a list of ids. Returns
 * a Map keyed by application_id. Used by the admin list view.
 */
export async function getLatestFitScoresForApplications(
  applicationIds: string[],
): Promise<Map<string, StoredFitScore>> {
  if (applicationIds.length === 0) return new Map();
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("customer_fit_scores")
    .select(
      "id, application_id, model_id, composite_score, dimensions, derived_priority, computed_at, computed_by",
    )
    .in("application_id", applicationIds)
    .order("computed_at", { ascending: false });
  if (error) {
    throw new Error(`customer_fit_scores fetch failed: ${error.message}`);
  }
  const out = new Map<string, StoredFitScore>();
  for (const r of data ?? []) {
    const appId = (r as { application_id: string }).application_id;
    if (out.has(appId)) continue; // first row wins (most recent)
    out.set(appId, {
      id: (r as { id: string }).id,
      application_id: appId,
      model_id: (r as { model_id: string }).model_id,
      composite_score: (r as { composite_score: number }).composite_score,
      dimensions: (r as { dimensions: Record<string, number> }).dimensions,
      derived_priority:
        (r as { derived_priority: DerivedPriority | null }).derived_priority,
      computed_at: (r as { computed_at: string }).computed_at,
      computed_by: (r as { computed_by: string | null }).computed_by,
      model_version: SCORING_MODEL_VERSION,
    });
  }
  return out;
}

// Helper to keep typecheck honest when reading dimensions back.
export function dimensionScore(
  d: Record<string, number>,
  key: DimensionKey,
): number {
  return d[key] ?? 0;
}
