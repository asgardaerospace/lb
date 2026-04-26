import { createServiceSupabase } from "@/lib/supabase/server";
import type {
  Capability,
  CapabilityCreateInput,
  CapabilityUpdateInput,
  Machine,
  MachineCreateInput,
  MachineUpdateInput,
} from "./types";

const MACHINE_COLUMNS =
  "id, organization_id, machine_type, materials_supported, capacity, created_at, updated_at, created_by";

const CAPABILITY_COLUMNS =
  "id, organization_id, process_type, materials_supported, created_at, updated_at, created_by";

// ---------- machines ----------

export async function listMachines(orgId: string): Promise<Machine[]> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("machines")
    .select(MACHINE_COLUMNS)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Machine list failed: ${error.message}`);
  return (data ?? []) as Machine[];
}

export async function getMachine(id: string): Promise<Machine | null> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("machines")
    .select(MACHINE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Machine fetch failed: ${error.message}`);
  return (data as Machine | null) ?? null;
}

export async function createMachine(
  orgId: string,
  userId: string,
  input: MachineCreateInput,
): Promise<Machine> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("machines")
    .insert({
      organization_id: orgId,
      machine_type: input.machine_type,
      materials_supported: input.materials_supported ?? [],
      capacity: input.capacity ?? null,
      created_by: userId,
    })
    .select(MACHINE_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(`Machine insert failed: ${error?.message ?? "no row"}`);
  }
  return data as Machine;
}

export async function updateMachine(
  id: string,
  patch: MachineUpdateInput,
): Promise<Machine> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("machines")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(MACHINE_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(`Machine update failed: ${error?.message ?? "no row"}`);
  }
  return data as Machine;
}

export async function deleteMachine(id: string): Promise<void> {
  const sb = createServiceSupabase();
  const { error } = await sb.from("machines").delete().eq("id", id);
  if (error) throw new Error(`Machine delete failed: ${error.message}`);
}

// ---------- capabilities ----------

export async function listCapabilities(orgId: string): Promise<Capability[]> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("capabilities")
    .select(CAPABILITY_COLUMNS)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Capability list failed: ${error.message}`);
  return (data ?? []) as Capability[];
}

export async function getCapability(id: string): Promise<Capability | null> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("capabilities")
    .select(CAPABILITY_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Capability fetch failed: ${error.message}`);
  return (data as Capability | null) ?? null;
}

export async function createCapability(
  orgId: string,
  userId: string,
  input: CapabilityCreateInput,
): Promise<Capability> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("capabilities")
    .insert({
      organization_id: orgId,
      process_type: input.process_type,
      materials_supported: input.materials_supported ?? [],
      created_by: userId,
    })
    .select(CAPABILITY_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(`Capability insert failed: ${error?.message ?? "no row"}`);
  }
  return data as Capability;
}

export async function updateCapability(
  id: string,
  patch: CapabilityUpdateInput,
): Promise<Capability> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("capabilities")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(CAPABILITY_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(`Capability update failed: ${error?.message ?? "no row"}`);
  }
  return data as Capability;
}

export async function deleteCapability(id: string): Promise<void> {
  const sb = createServiceSupabase();
  const { error } = await sb.from("capabilities").delete().eq("id", id);
  if (error) throw new Error(`Capability delete failed: ${error.message}`);
}
