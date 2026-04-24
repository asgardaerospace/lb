import { z } from "zod";

export type WorkPackageStatus = "open" | "routed";
export type RoutingDecisionStatus = "pending" | "quote_requested";

export interface WorkPackage {
  id: string;
  rfq_id: string;
  package_name: string;
  package_type: string | null;
  description: string | null;
  status: WorkPackageStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WorkPackagePart {
  work_package_id: string;
  part_id: string;
  created_at: string;
  created_by: string | null;
}

export interface RoutingDecision {
  id: string;
  work_package_id: string;
  supplier_organization_id: string;
  capability_fit_score: number | null;
  capacity_fit_score: number | null;
  compliance_fit_score: number | null;
  schedule_fit_score: number | null;
  routing_rationale: string | null;
  routing_status: RoutingDecisionStatus;
  quote_requested_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CandidateSupplier {
  organization_id: string;
  organization_name: string;
  approval_status: string;
  as9100_certified: boolean;
  iso9001_certified: boolean;
  itar_registered: boolean;
  cmmc_status: string;
  capacity_notes: string | null;
}

// ---------- zod ----------

const fitScore = z
  .number()
  .int()
  .min(0)
  .max(100)
  .nullable()
  .optional();

export const workPackageCreateSchema = z.object({
  package_name: z.string().min(1).max(200),
  package_type: z.string().max(100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
});

export const workPackagePartAttachSchema = z.object({
  part_id: z.string().uuid(),
});

export const routingDecisionCreateSchema = z.object({
  supplier_organization_id: z.string().uuid(),
  capability_fit_score: fitScore,
  capacity_fit_score: fitScore,
  compliance_fit_score: fitScore,
  schedule_fit_score: fitScore,
  routing_rationale: z.string().max(5000).nullable().optional(),
});

export type WorkPackageCreate = z.infer<typeof workPackageCreateSchema>;
export type RoutingDecisionCreate = z.infer<typeof routingDecisionCreateSchema>;
