import type { SupplierApplicationListRow } from "./types";
import type { StoredSupplierFitScore } from "./scoring-repository";

/**
 * Illustrative supplier-application rows for the admin list when there's
 * no asgard_admin session or Supabase env vars are missing.
 */
export const PREVIEW_SUPPLIER_APPLICATIONS: SupplierApplicationListRow[] = [
  {
    id: "sa-prev-1",
    status: "submitted",
    legal_name: "Anvil Precision Machining, Inc.",
    dba: "Anvil",
    hq_state: "WA",
    hq_country: "US",
    itar_registered: true,
    cmmc_level: "level_2",
    primary_processes: ["CNC machining", "EDM", "Heat treat"],
    intake_email: "ops@anvilprecision.com",
    submitted_at: "2026-04-25T15:18:00Z",
    reviewed_at: null,
    created_at: "2026-04-25T15:00:00Z",
  },
  {
    id: "sa-prev-2",
    status: "under_review",
    legal_name: "Cardinal Composites Co.",
    dba: null,
    hq_state: "TX",
    hq_country: "US",
    itar_registered: false,
    cmmc_level: "none",
    primary_processes: ["Composites", "Assembly"],
    intake_email: "rfq@cardinalcomposites.com",
    submitted_at: "2026-04-22T10:42:00Z",
    reviewed_at: "2026-04-23T08:11:00Z",
    created_at: "2026-04-22T10:30:00Z",
  },
  {
    id: "sa-prev-3",
    status: "approved",
    legal_name: "Meridian Sheet Metal, LLC",
    dba: "Meridian",
    hq_state: "CA",
    hq_country: "US",
    itar_registered: true,
    cmmc_level: "level_1",
    primary_processes: ["Sheet metal", "Welding", "Coatings"],
    intake_email: "info@meridiansheet.com",
    submitted_at: "2026-04-18T09:14:00Z",
    reviewed_at: "2026-04-21T13:55:00Z",
    created_at: "2026-04-18T09:00:00Z",
  },
  {
    id: "sa-prev-4",
    status: "revisions_requested",
    legal_name: "Polaris Additive",
    dba: null,
    hq_state: "MN",
    hq_country: "US",
    itar_registered: false,
    cmmc_level: "none",
    primary_processes: ["Additive manufacturing"],
    intake_email: "founder@polarisadditive.com",
    submitted_at: "2026-04-12T16:08:00Z",
    reviewed_at: "2026-04-14T11:21:00Z",
    created_at: "2026-04-12T16:00:00Z",
  },
  {
    id: "sa-prev-5",
    status: "rejected",
    legal_name: "Borealis Tooling",
    dba: null,
    hq_state: "OR",
    hq_country: "US",
    itar_registered: false,
    cmmc_level: "none",
    primary_processes: ["CNC machining"],
    intake_email: "sales@borealistooling.io",
    submitted_at: "2026-04-09T12:33:00Z",
    reviewed_at: "2026-04-10T07:50:00Z",
    created_at: "2026-04-09T12:30:00Z",
  },
];

const PREVIEW_MODEL_ID = "model-prev-supplier-readiness-v2";

function previewScore(
  appId: string,
  composite: number,
  recommendation: "routing_ready" | "qualified" | "conditional" | "defer",
  dimensions: Record<string, number>,
  hardGateFailures: string[],
  computedAt: string,
): StoredSupplierFitScore {
  return {
    id: `score-prev-${appId}`,
    application_id: appId,
    model_id: PREVIEW_MODEL_ID,
    composite_score: composite,
    dimensions,
    hard_gate_failures: hardGateFailures,
    computed_at: computedAt,
    computed_by: null,
    model_version: 2,
    recommendation,
  };
}

export const PREVIEW_SUPPLIER_APPLICATION_SCORES: Map<
  string,
  StoredSupplierFitScore
> = new Map([
  [
    "sa-prev-1",
    previewScore(
      "sa-prev-1",
      88,
      "routing_ready",
      {
        compliance: 100,
        capability_breadth: 80,
        machine_sophistication: 90,
        past_performance: 80,
        workforce_scale: 80,
        quality_indicators: 80,
        specialization: 90,
      },
      [],
      "2026-04-25T15:30:00Z",
    ),
  ],
  [
    "sa-prev-2",
    previewScore(
      "sa-prev-2",
      72,
      "qualified",
      {
        compliance: 30,
        capability_breadth: 80,
        machine_sophistication: 75,
        past_performance: 90,
        workforce_scale: 80,
        quality_indicators: 60,
        specialization: 80,
      },
      ["No CMMC level — verify scope before CUI work."],
      "2026-04-23T08:30:00Z",
    ),
  ],
  [
    "sa-prev-3",
    previewScore(
      "sa-prev-3",
      63,
      "conditional",
      {
        compliance: 70,
        capability_breadth: 60,
        machine_sophistication: 50,
        past_performance: 60,
        workforce_scale: 50,
        quality_indicators: 60,
        specialization: 80,
      },
      [],
      "2026-04-21T14:10:00Z",
    ),
  ],
  [
    "sa-prev-4",
    previewScore(
      "sa-prev-4",
      48,
      "defer",
      {
        compliance: 0,
        capability_breadth: 35,
        machine_sophistication: 60,
        past_performance: 30,
        workforce_scale: 50,
        quality_indicators: 20,
        specialization: 80,
      },
      [
        "No certifications declared.",
        "Single-process specialist — limited routing breadth.",
      ],
      "2026-04-14T11:30:00Z",
    ),
  ],
  // sa-prev-5 intentionally has no score so the list shows the "—" state
]);
