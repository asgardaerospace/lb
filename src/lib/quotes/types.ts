import { z } from "zod";

export type QuoteStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "declined";

export type JobStatus = "awarded";

export interface Quote {
  id: string;
  work_package_id: string;
  supplier_organization_id: string;
  quoted_price: string | null;
  lead_time_days: number | null;
  minimum_order_quantity: number | null;
  quote_notes: string | null;
  status: QuoteStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Job {
  id: string;
  work_package_id: string;
  supplier_organization_id: string;
  quote_id: string | null;
  status: JobStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const quoteSubmitSchema = z.object({
  quoted_price: z
    .number()
    .nonnegative()
    .nullable()
    .optional()
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional()),
  lead_time_days: z.number().int().nonnegative().nullable().optional(),
  minimum_order_quantity: z.number().int().positive().nullable().optional(),
  quote_notes: z.string().max(5000).nullable().optional(),
});

export const declineSchema = z.object({
  quote_notes: z.string().max(5000).nullable().optional(),
});

export const reviewNoteSchema = z.object({
  review_notes: z.string().max(5000).optional(),
});

export type QuoteSubmit = z.infer<typeof quoteSubmitSchema>;
