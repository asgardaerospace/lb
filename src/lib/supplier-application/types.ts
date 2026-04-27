import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Payload schema — permissive (.passthrough() on inner objects) so future
// wizard additions land in JSONB unchanged. Only headline columns are
// validated strictly.
// ────────────────────────────────────────────────────────────────────────────

export const CMMC_LEVELS = ["none", "level_1", "level_2", "level_3"] as const;
export type CmmcLevel = (typeof CMMC_LEVELS)[number];

const certificationSchema = z
  .object({
    cert_type: z.string().min(1, "cert_type is required"),
    issuer: z.string().optional().nullable(),
    issued_date: z.string().optional().nullable(),
    expiration_date: z.string().optional().nullable(),
    certificate_no: z.string().optional().nullable(),
  })
  .passthrough();

const machineSchema = z
  .object({
    machine_type: z.string().min(1, "machine_type is required"),
    manufacturer: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    envelope: z.string().optional().nullable(),
    axis_count: z.union([z.number().int(), z.string()]).optional().nullable(),
    tolerance_capability: z.string().optional().nullable(),
    materials_supported: z.array(z.string()).default([]),
    count: z.union([z.number().int(), z.string()]).optional().nullable(),
  })
  .passthrough();

const capabilitySchema = z
  .object({
    process_type: z.string().min(1, "process_type is required"),
    materials: z.array(z.string()).default([]),
    notes: z.string().optional().nullable(),
  })
  .passthrough();

const pastPerformanceSchema = z
  .object({
    customer_name: z.string().min(1, "customer_name is required"),
    program_name: z.string().optional().nullable(),
    contract_type: z.string().optional().nullable(),
    year_start: z.union([z.number().int(), z.string()]).optional().nullable(),
    year_end: z.union([z.number().int(), z.string()]).optional().nullable(),
    contract_value_usd: z
      .union([z.number(), z.string()])
      .optional()
      .nullable(),
    references_contact: z.string().optional().nullable(),
  })
  .passthrough();

export const supplierApplicationPayloadSchema = z
  .object({
    company: z
      .object({
        legal_name: z.string().min(1, "legal_name is required"),
        dba: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        hq_city: z.string().optional().nullable(),
        hq_state: z.string().optional().nullable(),
        hq_country: z.string().default("US"),
        team_size: z.union([z.number().int(), z.string()]).optional().nullable(),
        year_founded: z
          .union([z.number().int(), z.string()])
          .optional()
          .nullable(),
        duns: z.string().optional().nullable(),
        cage: z.string().optional().nullable(),
      })
      .passthrough(),
    facility: z.record(z.string(), z.unknown()).default({}),
    compliance: z
      .object({
        itar_registered: z.boolean().default(false),
        cmmc_level: z.enum(CMMC_LEVELS).default("none"),
      })
      .passthrough(),
    primary_processes: z.array(z.string()).default([]),
    capabilities: z.array(capabilitySchema).default([]),
    machines: z.array(machineSchema).default([]),
    certifications: z.array(certificationSchema).default([]),
    past_performance: z.array(pastPerformanceSchema).default([]),
  })
  .passthrough();

export type SupplierApplicationPayload = z.infer<
  typeof supplierApplicationPayloadSchema
>;

// ────────────────────────────────────────────────────────────────────────────
// Submit envelope — what the API endpoint accepts.
// ────────────────────────────────────────────────────────────────────────────

export const supplierApplicationSubmitSchema = z.object({
  intake_email: z
    .string()
    .email("Invalid email")
    .max(320)
    .optional()
    .nullable(),
  payload_schema_version: z.number().int().min(1).default(1),
  payload: supplierApplicationPayloadSchema,
});

export type SupplierApplicationSubmitInput = z.infer<
  typeof supplierApplicationSubmitSchema
>;

// ────────────────────────────────────────────────────────────────────────────
// API result shape
// ────────────────────────────────────────────────────────────────────────────

export interface SubmittedSupplierApplication {
  id: string;
  status: string;
  legal_name: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Admin review types
// ────────────────────────────────────────────────────────────────────────────

export type SupplierApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revisions_requested"
  | "withdrawn";

export const SUPPLIER_REVIEW_ACTIONS = [
  "mark_under_review",
  "request_info",
  "approve",
  "reject",
] as const;
export type SupplierReviewAction = (typeof SUPPLIER_REVIEW_ACTIONS)[number];

export const SUPPLIER_REVIEW_ACTION_TO_STATUS: Record<
  SupplierReviewAction,
  SupplierApplicationStatus
> = {
  mark_under_review: "under_review",
  request_info: "revisions_requested",
  approve: "approved",
  reject: "rejected",
};

export interface SupplierApplicationListRow {
  id: string;
  status: SupplierApplicationStatus;
  legal_name: string;
  dba: string | null;
  hq_state: string | null;
  hq_country: string;
  itar_registered: boolean;
  cmmc_level: CmmcLevel;
  primary_processes: string[];
  intake_email: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SupplierApplicationDetail extends SupplierApplicationListRow {
  hq_city: string | null;
  team_size: number | null;
  year_founded: number | null;
  duns: string | null;
  cage: string | null;
  payload: Record<string, unknown>;
  payload_schema_version: number;
  decision_notes: string | null;
  reviewed_by: string | null;
  organization_id: string | null;
  intake_token: string | null;
}

export interface SupplierApplicationCertificationRow {
  id: string;
  cert_type: string;
  issuer: string | null;
  issued_date: string | null;
  expiration_date: string | null;
  certificate_no: string | null;
}

export interface SupplierApplicationMachineRow {
  id: string;
  machine_type: string;
  manufacturer: string | null;
  model: string | null;
  envelope: string | null;
  axis_count: number | null;
  tolerance_capability: string | null;
  materials_supported: string[];
  count: number;
}

export interface SupplierApplicationCapabilityRow {
  id: string;
  process_type: string;
  materials: string[];
  notes: string | null;
}

export interface SupplierApplicationPastPerformanceRow {
  id: string;
  customer_name: string;
  program_name: string | null;
  contract_type: string | null;
  year_start: number | null;
  year_end: number | null;
  contract_value_usd: number | null;
  references_contact: string | null;
}

export interface SupplierApplicationReviewRow {
  id: string;
  reviewer_id: string;
  reviewer_email: string | null;
  action: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SupplierApplicationFull {
  application: SupplierApplicationDetail;
  certifications: SupplierApplicationCertificationRow[];
  machines: SupplierApplicationMachineRow[];
  capabilities: SupplierApplicationCapabilityRow[];
  past_performance: SupplierApplicationPastPerformanceRow[];
  reviews: SupplierApplicationReviewRow[];
}

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

export function toIntegerOrNull(
  v: number | string | null | undefined,
): number | null {
  if (v == null) return null;
  if (typeof v === "number") {
    return Number.isFinite(v) ? Math.trunc(v) : null;
  }
  const trimmed = String(v).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function toNumericOrNull(
  v: number | string | null | undefined,
): number | null {
  if (v == null) return null;
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }
  const trimmed = String(v).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toIsoDateOrNull(v: string | null | undefined): string | null {
  if (!v) return null;
  const trimmed = String(v).trim();
  if (!trimmed) return null;
  // Accept anything Postgres can parse as a `date`. Pass through the raw
  // string and let Postgres validate; surface the error to the API caller
  // if it fails.
  return trimmed;
}
