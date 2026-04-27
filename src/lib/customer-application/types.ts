import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Payload schema — mirrors src/app/onboarding/types.ts CustomerData but is
// PERMISSIVE: every nested object uses .passthrough() so future wizard
// additions land in JSONB unchanged. Only the columns we extract for
// headline storage are validated strictly.
// ────────────────────────────────────────────────────────────────────────────

export const ORG_TYPES = ["startup", "prime", "oem", "enterprise", "gov"] as const;
export const FUNDING_STAGES = [
  "bootstrap",
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "public",
  "enterprise",
] as const;
export const GEOGRAPHIES = ["domestic_only", "five_eyes", "global"] as const;
export const LEAD_TOLERANCES = ["strict", "moderate", "flexible"] as const;
export const FIRST_USE_ACTIONS = ["first_part", "first_program", "pilot_rfq"] as const;
export const PROGRAM_STAGES = ["concept", "prototype", "lrip", "production"] as const;
export const CMMC_LEVELS = ["none", "level_1", "level_2", "level_3"] as const;

const contactSchema = z
  .object({
    role: z.string(),
    name: z.string(),
    title: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .passthrough();

const programTypeSchema = z
  .object({
    id: z.string(),
    label: z.string().optional(),
    on: z.boolean(),
    stage: z.enum(PROGRAM_STAGES).optional(),
    annual_volume: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .passthrough();

export const customerApplicationPayloadSchema = z
  .object({
    company: z
      .object({
        legal_name: z.string().min(1, "legal_name is required"),
        dba: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        hq_city: z.string().optional().nullable(),
        hq_state: z.string().optional().nullable(),
        hq_country: z.string().default("US"),
        team_size: z.string().optional().nullable(),
        org_type: z.enum(ORG_TYPES).optional(),
        funding_stage: z.enum(FUNDING_STAGES).optional(),
        year_founded: z.string().optional().nullable(),
        contacts: z.array(contactSchema).default([]),
      })
      .passthrough(),
    programs: z
      .object({
        types: z.array(programTypeSchema).default([]),
      })
      .passthrough(),
    manufacturing: z
      .object({
        processes: z.array(z.string()).default([]),
      })
      .passthrough(),
    compliance: z
      .object({
        itar: z.boolean().default(false),
        cui: z.boolean().default(false),
        as9100: z.boolean().default(false),
        nadcap: z.boolean().default(false),
        defense_program: z.boolean().default(false),
        defense_program_names: z.array(z.string()).default([]),
        cmmc_required_level: z.enum(CMMC_LEVELS).default("none"),
      })
      .passthrough(),
    program_chars: z
      .object({
        cost_vs_speed: z.number().int().min(0).max(100).default(50),
        risk_tolerance: z.string().optional(),
        typical_lead_time_weeks: z.string().optional().nullable(),
        lead_time_tolerance: z.enum(LEAD_TOLERANCES).optional(),
      })
      .passthrough(),
    supply_chain: z
      .object({
        geography: z.enum(GEOGRAPHIES).default("domestic_only"),
        preferred_supplier_count_per_part: z.string().default("2"),
        requires_dpas: z.boolean().default(false),
        buy_american_act: z.boolean().default(false),
        berry_amendment: z.boolean().default(false),
        regions: z.array(z.string()).default([]),
        preferred_supplier_types: z.array(z.string()).default([]),
      })
      .passthrough(),
    data: z.record(z.string(), z.unknown()).default({}),
    first_use: z
      .object({
        action: z.enum(FIRST_USE_ACTIONS).default("first_program"),
      })
      .passthrough(),
    workspace: z
      .object({
        workspace_name: z.string().optional().nullable(),
        subdomain: z.string().optional().nullable(),
        seats: z.string().optional().nullable(),
        data_residency: z.string().optional().nullable(),
        sso_provider: z.string().optional().nullable(),
        audit_log_retention_yrs: z.string().optional().nullable(),
      })
      .passthrough(),
  })
  .passthrough();

export type CustomerApplicationPayload = z.infer<typeof customerApplicationPayloadSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Submit envelope — what the API endpoint accepts.
// ────────────────────────────────────────────────────────────────────────────

export const customerApplicationSubmitSchema = z.object({
  // Required when no authenticated user — Phase 5 will add token verification.
  intake_email: z
    .string()
    .email("Invalid email")
    .max(320)
    .optional()
    .nullable(),
  payload_schema_version: z.number().int().min(1).default(1),
  payload: customerApplicationPayloadSchema,
});

export type CustomerApplicationSubmitInput = z.infer<typeof customerApplicationSubmitSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers used by the repository
// ────────────────────────────────────────────────────────────────────────────

export interface SubmittedCustomerApplication {
  id: string;
  status: string;
  derived_tier: string | null;
}

export type CustomerTier =
  | "defense_prime"
  | "itar_controlled"
  | "growth_stage"
  | "enterprise";

export function deriveCustomerTier(
  payload: CustomerApplicationPayload,
): CustomerTier {
  const itar = payload.compliance.itar;
  const cui = payload.compliance.cui;
  const defense = payload.compliance.defense_program;
  const orgType = payload.company.org_type;
  if (defense && itar && cui) return "defense_prime";
  if (itar) return "itar_controlled";
  if (orgType === "startup") return "growth_stage";
  return "enterprise";
}

export function toIntegerOrNull(s: string | null | undefined): number | null {
  if (s == null) return null;
  const trimmed = String(s).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}
