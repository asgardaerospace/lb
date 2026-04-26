import { z } from "zod";

export interface Machine {
  id: string;
  organization_id: string;
  machine_type: string;
  materials_supported: string[];
  capacity: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Capability {
  id: string;
  organization_id: string;
  process_type: string;
  materials_supported: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const materialsSchema = z
  .array(z.string().min(1).max(120))
  .max(40)
  .default([]);

export const machineCreateSchema = z.object({
  machine_type: z.string().min(1).max(160),
  materials_supported: materialsSchema,
  capacity: z.string().max(240).nullish(),
});

export const machineUpdateSchema = machineCreateSchema.partial();

export const capabilityCreateSchema = z.object({
  process_type: z.string().min(1).max(160),
  materials_supported: materialsSchema,
});

export const capabilityUpdateSchema = capabilityCreateSchema.partial();

export type MachineCreateInput = z.infer<typeof machineCreateSchema>;
export type MachineUpdateInput = z.infer<typeof machineUpdateSchema>;
export type CapabilityCreateInput = z.infer<typeof capabilityCreateSchema>;
export type CapabilityUpdateInput = z.infer<typeof capabilityUpdateSchema>;

/**
 * "Aluminum, Titanium, Stainless" → ["Aluminum","Titanium","Stainless"].
 * Empty/whitespace tokens are dropped. Used by both the form and the API
 * so users can type a comma list rather than wrangle JSON.
 */
export function parseMaterials(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
