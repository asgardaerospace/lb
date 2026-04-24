import { z } from "zod";

export type SupplierApprovalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revisions_requested";

export type CmmcStatus = "none" | "level_1" | "level_2" | "level_3";

export interface SupplierProfile {
  id: string;
  organization_id: string;
  approval_status: SupplierApprovalStatus;

  company_summary: string | null;
  facility_size_sqft: number | null;
  employee_count: number | null;
  quality_system_notes: string | null;
  capacity_notes: string | null;

  as9100_certified: boolean;
  iso9001_certified: boolean;
  itar_registered: boolean;
  cmmc_status: CmmcStatus;

  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const profileDraftSchema = z.object({
  company_summary: z.string().max(5000).nullable().optional(),
  facility_size_sqft: z.number().int().nonnegative().nullable().optional(),
  employee_count: z.number().int().nonnegative().nullable().optional(),
  quality_system_notes: z.string().max(5000).nullable().optional(),
  capacity_notes: z.string().max(5000).nullable().optional(),
  as9100_certified: z.boolean().optional(),
  iso9001_certified: z.boolean().optional(),
  itar_registered: z.boolean().optional(),
  cmmc_status: z.enum(["none", "level_1", "level_2", "level_3"]).optional(),
});

export type ProfileDraft = z.infer<typeof profileDraftSchema>;

export const reviewNoteSchema = z.object({
  review_notes: z.string().max(5000).optional(),
});
