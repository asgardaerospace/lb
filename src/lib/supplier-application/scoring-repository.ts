import { createServiceSupabase } from "@/lib/supabase/server";
import { getSupplierApplicationFull } from "./repository";
import {
  SCORING_MODEL_KEY,
  SCORING_MODEL_VERSION,
  SCORING_WEIGHTS,
  scoreSupplierApplication,
  type DerivedRecommendation,
  type DimensionKey,
} from "./scoring";

export interface StoredSupplierFitScore {
  id: string;
  application_id: string;
  model_id: string;
  composite_score: number;
  dimensions: Record<string, number>;
  hard_gate_failures: string[];
  computed_at: string;
  computed_by: string | null;
  model_version: number;
  // Recommendation isn't a column on supplier_readiness_scores — derived
  // from composite at read time and surfaced for UI convenience.
  recommendation: DerivedRecommendation;
}

interface ComputeOptions {
  computedBy?: string | null;
}

/**
 * Idempotently ensures the v2 supplier_readiness scoring model row exists.
 * v1 was seeded by migration 0013; v2 carries the seven-dimension layout
 * defined by the scorer here.
 */
export async function ensureSupplierReadinessModelV2(): Promise<string> {
  const supabase = createServiceSupabase();
  const existing = await supabase
    .from("scoring_models")
    .select("id")
    .eq("kind", SCORING_MODEL_KEY)
    .eq("version", SCORING_MODEL_VERSION)
    .maybeSingle();
  if (existing.error) {
    throw new Error(`scoring_models lookup failed: ${existing.error.message}`);
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
        "Supplier readiness v2 — seven dimensions: compliance, capability breadth, machine sophistication, past performance, workforce scale, quality indicators, specialization. Composite is weighted average; recommendation bands routing_ready ≥85, qualified 70-84, conditional 55-69, defer <55.",
    })
    .select("id")
    .single();
  if (ins.error || !ins.data) {
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

export async function computeAndStoreSupplierFitScore(
  applicationId: string,
  opts: ComputeOptions = {},
): Promise<StoredSupplierFitScore> {
  const full = await getSupplierApplicationFull(applicationId);
  if (!full) {
    throw new Error(`application not found: ${applicationId}`);
  }

  const result = scoreSupplierApplication(full);
  const modelId = await ensureSupplierReadinessModelV2();
  const supabase = createServiceSupabase();

  const dimensionsForStorage: Record<string, number> = {};
  for (const d of result.dimensions) {
    dimensionsForStorage[d.key] = d.score;
  }

  const computedAt = new Date().toISOString();
  const upsert = await supabase
    .from("supplier_readiness_scores")
    .upsert(
      {
        application_id: applicationId,
        model_id: modelId,
        composite_score: result.composite,
        dimensions: dimensionsForStorage,
        hard_gate_failures: result.riskFlags,
        computed_at: computedAt,
        computed_by: opts.computedBy ?? null,
      },
      { onConflict: "application_id,model_id" },
    )
    .select(
      "id, application_id, model_id, composite_score, dimensions, hard_gate_failures, computed_at, computed_by",
    )
    .single();
  if (upsert.error || !upsert.data) {
    throw new Error(
      `supplier_readiness_scores upsert failed: ${
        upsert.error?.message ?? "no row returned"
      }`,
    );
  }

  const auditRes = await supabase.from("audit_logs").insert({
    action: "supplier_application.scored",
    entity_type: "supplier_application",
    entity_id: applicationId,
    user_id: opts.computedBy ?? null,
    organization_id: full.application.organization_id ?? null,
    metadata: {
      model_kind: SCORING_MODEL_KEY,
      model_version: SCORING_MODEL_VERSION,
      composite: result.composite,
      recommendation: result.recommendation,
      dimensions: dimensionsForStorage,
      risk_flag_count: result.riskFlags.length,
      strength_count: result.strengths.length,
      tags: result.tags,
    },
  });
  if (auditRes.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[supplier-application.scoring] audit insert failed:",
      auditRes.error.message,
    );
  }

  return {
    id: upsert.data.id as string,
    application_id: upsert.data.application_id as string,
    model_id: upsert.data.model_id as string,
    composite_score: upsert.data.composite_score as number,
    dimensions: upsert.data.dimensions as Record<string, number>,
    hard_gate_failures:
      (upsert.data.hard_gate_failures as string[] | null) ?? [],
    computed_at: upsert.data.computed_at as string,
    computed_by: upsert.data.computed_by as string | null,
    model_version: SCORING_MODEL_VERSION,
    recommendation: result.recommendation,
  };
}

export async function getLatestSupplierFitScore(
  applicationId: string,
): Promise<StoredSupplierFitScore | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("supplier_readiness_scores")
    .select(
      "id, application_id, model_id, composite_score, dimensions, hard_gate_failures, computed_at, computed_by",
    )
    .eq("application_id", applicationId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(
      `supplier_readiness_scores fetch failed: ${error.message}`,
    );
  }
  if (!data) return null;
  return rowToScore(data);
}

export async function getLatestSupplierFitScoresForApplications(
  applicationIds: string[],
): Promise<Map<string, StoredSupplierFitScore>> {
  if (applicationIds.length === 0) return new Map();
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("supplier_readiness_scores")
    .select(
      "id, application_id, model_id, composite_score, dimensions, hard_gate_failures, computed_at, computed_by",
    )
    .in("application_id", applicationIds)
    .order("computed_at", { ascending: false });
  if (error) {
    throw new Error(
      `supplier_readiness_scores fetch failed: ${error.message}`,
    );
  }
  const out = new Map<string, StoredSupplierFitScore>();
  for (const r of data ?? []) {
    const appId = (r as { application_id: string }).application_id;
    if (out.has(appId)) continue;
    out.set(appId, rowToScore(r));
  }
  return out;
}

export function dimensionScore(
  d: Record<string, number>,
  key: DimensionKey,
): number {
  return d[key] ?? 0;
}

function rowToScore(row: unknown): StoredSupplierFitScore {
  const r = row as {
    id: string;
    application_id: string;
    model_id: string;
    composite_score: number;
    dimensions: Record<string, number>;
    hard_gate_failures: string[] | null;
    computed_at: string;
    computed_by: string | null;
  };
  const composite = r.composite_score;
  const recommendation: DerivedRecommendation =
    composite >= 85
      ? "routing_ready"
      : composite >= 70
        ? "qualified"
        : composite >= 55
          ? "conditional"
          : "defer";
  return {
    id: r.id,
    application_id: r.application_id,
    model_id: r.model_id,
    composite_score: composite,
    dimensions: r.dimensions,
    hard_gate_failures: r.hard_gate_failures ?? [],
    computed_at: r.computed_at,
    computed_by: r.computed_by,
    model_version: SCORING_MODEL_VERSION,
    recommendation,
  };
}
