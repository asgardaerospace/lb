import { z } from "zod";

export type JobStatus =
  | "awarded"
  | "scheduled"
  | "in_production"
  | "inspection"
  | "shipped"
  | "complete";

export interface Job {
  id: string;
  job_number: string | null;
  work_package_id: string;
  supplier_organization_id: string;
  quote_id: string | null;
  status: JobStatus;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  last_issue_note: string | null;
  last_issue_flagged_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const statusUpdateSchema = z.object({
  status: z.enum([
    "awarded",
    "scheduled",
    "in_production",
    "inspection",
    "shipped",
    "complete",
  ]),
  note: z.string().max(5000).optional(),
});

export const issueFlagSchema = z.object({
  note: z.string().min(1).max(5000),
});

export type StatusUpdate = z.infer<typeof statusUpdateSchema>;
