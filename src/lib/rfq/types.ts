import { z } from "zod";

export type ProgramStatus = "active" | "archived";
export type RfqStatus = "draft" | "submitted";
export type RfqPriority = "low" | "normal" | "high" | "urgent";

export interface Program {
  id: string;
  buyer_organization_id: string;
  program_name: string;
  program_type: string | null;
  description: string | null;
  compliance_level: string | null;
  itar_controlled: boolean;
  cui_controlled: boolean;
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Rfq {
  id: string;
  program_id: string;
  rfq_title: string;
  description: string | null;
  quantity: number | null;
  required_delivery_date: string | null;
  priority: RfqPriority;
  status: RfqStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Part {
  id: string;
  rfq_id: string;
  part_number: string;
  part_name: string | null;
  revision: string | null;
  material: string | null;
  process_required: string | null;
  quantity: number | null;
  tolerance_notes: string | null;
  finish_requirements: string | null;
  inspection_requirements: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ---------- Zod schemas ----------

export const programCreateSchema = z.object({
  program_name: z.string().min(1).max(200),
  program_type: z.string().max(100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  compliance_level: z.string().max(100).nullable().optional(),
  itar_controlled: z.boolean().optional(),
  cui_controlled: z.boolean().optional(),
});

export const rfqCreateSchema = z.object({
  rfq_title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  quantity: z.number().int().positive().nullable().optional(),
  required_delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const rfqUpdateSchema = rfqCreateSchema.partial();

export const partUpsertSchema = z.object({
  part_number: z.string().min(1).max(100),
  part_name: z.string().max(200).nullable().optional(),
  revision: z.string().max(50).nullable().optional(),
  material: z.string().max(200).nullable().optional(),
  process_required: z.string().max(200).nullable().optional(),
  quantity: z.number().int().positive().nullable().optional(),
  tolerance_notes: z.string().max(2000).nullable().optional(),
  finish_requirements: z.string().max(2000).nullable().optional(),
  inspection_requirements: z.string().max(2000).nullable().optional(),
});

export type ProgramCreate = z.infer<typeof programCreateSchema>;
export type RfqCreate = z.infer<typeof rfqCreateSchema>;
export type RfqUpdate = z.infer<typeof rfqUpdateSchema>;
export type PartUpsert = z.infer<typeof partUpsertSchema>;
