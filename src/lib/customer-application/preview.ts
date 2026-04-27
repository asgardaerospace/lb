import type { CustomerApplicationListRow } from "./types";
import type { StoredFitScore } from "./scoring-repository";

/**
 * Illustrative rows for the admin list when there's no asgard_admin session
 * or Supabase env vars are missing. Match the shape returned by
 * listCustomerApplications().
 */
export const PREVIEW_CUSTOMER_APPLICATIONS: CustomerApplicationListRow[] = [
  {
    id: "ca-prev-1",
    status: "submitted",
    legal_name: "Helios Aerodyne, Inc.",
    dba: "Helios",
    hq_state: "CA",
    hq_country: "US",
    org_type: "startup",
    derived_tier: "defense_prime",
    itar: true,
    defense_program: true,
    intake_email: "jordan@heliosaerodyne.com",
    submitted_at: "2026-04-25T16:42:00Z",
    reviewed_at: null,
    created_at: "2026-04-25T16:30:00Z",
  },
  {
    id: "ca-prev-2",
    status: "under_review",
    legal_name: "Northstar Propulsion Systems, LLC",
    dba: null,
    hq_state: "WA",
    hq_country: "US",
    org_type: "oem",
    derived_tier: "enterprise",
    itar: true,
    defense_program: false,
    intake_email: "ops@northstarprop.com",
    submitted_at: "2026-04-22T11:08:00Z",
    reviewed_at: "2026-04-23T09:14:00Z",
    created_at: "2026-04-22T11:00:00Z",
  },
  {
    id: "ca-prev-3",
    status: "approved",
    legal_name: "Pelican Microsat Co.",
    dba: "Pelican",
    hq_state: "CO",
    hq_country: "US",
    org_type: "startup",
    derived_tier: "growth_stage",
    itar: false,
    defense_program: false,
    intake_email: "alex@pelican.space",
    submitted_at: "2026-04-18T09:55:00Z",
    reviewed_at: "2026-04-21T14:02:00Z",
    created_at: "2026-04-18T09:50:00Z",
  },
  {
    id: "ca-prev-4",
    status: "revisions_requested",
    legal_name: "Coastal Avionics Group",
    dba: null,
    hq_state: "FL",
    hq_country: "US",
    org_type: "prime",
    derived_tier: "itar_controlled",
    itar: true,
    defense_program: false,
    intake_email: "procurement@coastalavionics.io",
    submitted_at: "2026-04-12T14:18:00Z",
    reviewed_at: "2026-04-14T10:05:00Z",
    created_at: "2026-04-12T14:10:00Z",
  },
  {
    id: "ca-prev-5",
    status: "rejected",
    legal_name: "Briar Robotics",
    dba: null,
    hq_state: "MI",
    hq_country: "US",
    org_type: "startup",
    derived_tier: "growth_stage",
    itar: false,
    defense_program: false,
    intake_email: "founder@briar.bot",
    submitted_at: "2026-04-09T17:33:00Z",
    reviewed_at: "2026-04-10T08:21:00Z",
    created_at: "2026-04-09T17:30:00Z",
  },
];

const PREVIEW_MODEL_ID = "model-prev-customer-fit-v2";

function previewScore(
  appId: string,
  composite: number,
  priority: "P0" | "P1" | "P2" | "review",
  dimensions: Record<string, number>,
  computedAt: string,
): StoredFitScore {
  return {
    id: `score-prev-${appId}`,
    application_id: appId,
    model_id: PREVIEW_MODEL_ID,
    composite_score: composite,
    dimensions,
    derived_priority: priority,
    computed_at: computedAt,
    computed_by: null,
    model_version: 2,
  };
}

export const PREVIEW_CUSTOMER_APPLICATION_SCORES: Map<
  string,
  StoredFitScore
> = new Map([
  [
    "ca-prev-1",
    previewScore(
      "ca-prev-1",
      87,
      "P0",
      {
        compliance_complexity: 30,
        manufacturing_fit: 90,
        program_maturity: 75,
        production_volume: 95,
        data_readiness: 100,
        strategic_fit: 95,
      },
      "2026-04-25T16:50:00Z",
    ),
  ],
  [
    "ca-prev-2",
    previewScore(
      "ca-prev-2",
      72,
      "P1",
      {
        compliance_complexity: 65,
        manufacturing_fit: 80,
        program_maturity: 60,
        production_volume: 80,
        data_readiness: 75,
        strategic_fit: 65,
      },
      "2026-04-23T09:20:00Z",
    ),
  ],
  [
    "ca-prev-3",
    previewScore(
      "ca-prev-3",
      63,
      "P2",
      {
        compliance_complexity: 100,
        manufacturing_fit: 60,
        program_maturity: 50,
        production_volume: 45,
        data_readiness: 75,
        strategic_fit: 50,
      },
      "2026-04-21T14:10:00Z",
    ),
  ],
  [
    "ca-prev-4",
    previewScore(
      "ca-prev-4",
      54,
      "review",
      {
        compliance_complexity: 65,
        manufacturing_fit: 50,
        program_maturity: 50,
        production_volume: 40,
        data_readiness: 50,
        strategic_fit: 70,
      },
      "2026-04-14T10:10:00Z",
    ),
  ],
  // ca-prev-5 intentionally has no score so the list shows the "—" state
]);
