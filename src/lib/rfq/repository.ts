import { createServerSupabase } from "@/lib/supabase/server";
import type {
  Part,
  PartUpsert,
  Program,
  ProgramCreate,
  Rfq,
  RfqCreate,
  RfqStatus,
  RfqUpdate,
} from "@/lib/rfq/types";

const PROGRAM_COLUMNS =
  "id, buyer_organization_id, program_name, program_type, description, compliance_level, itar_controlled, cui_controlled, status, created_at, updated_at, created_by";

const RFQ_COLUMNS =
  "id, program_id, rfq_title, description, quantity, required_delivery_date, priority, status, submitted_at, created_at, updated_at, created_by";

const PART_COLUMNS =
  "id, rfq_id, part_number, part_name, revision, material, process_required, quantity, tolerance_notes, finish_requirements, inspection_requirements, created_at, updated_at, created_by";

// ---------- programs ----------

export async function createProgram(
  orgId: string,
  userId: string,
  input: ProgramCreate,
): Promise<Program> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("programs")
    .insert({
      buyer_organization_id: orgId,
      created_by: userId,
      program_name: input.program_name,
      program_type: input.program_type ?? null,
      description: input.description ?? null,
      compliance_level: input.compliance_level ?? null,
      itar_controlled: input.itar_controlled ?? false,
      cui_controlled: input.cui_controlled ?? false,
    })
    .select(PROGRAM_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Program;
}

export async function listProgramsForOrg(orgId: string): Promise<Program[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .eq("buyer_organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Program[];
}

export async function getProgramById(id: string): Promise<Program | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Program | null) ?? null;
}

// ---------- rfqs ----------

export async function createRfq(
  programId: string,
  userId: string,
  input: RfqCreate,
): Promise<Rfq> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .insert({
      program_id: programId,
      created_by: userId,
      rfq_title: input.rfq_title,
      description: input.description ?? null,
      quantity: input.quantity ?? null,
      required_delivery_date: input.required_delivery_date ?? null,
      priority: input.priority ?? "normal",
    })
    .select(RFQ_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Rfq;
}

export async function listRfqsForOrg(orgId: string): Promise<Rfq[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .select(`${RFQ_COLUMNS}, programs!inner(buyer_organization_id)`)
    .eq("programs.buyer_organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(stripJoin) as Rfq[];
}

export async function listRfqsForProgram(programId: string): Promise<Rfq[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .select(RFQ_COLUMNS)
    .eq("program_id", programId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Rfq[];
}

export async function listRfqsByStatus(
  statuses: RfqStatus[],
): Promise<Rfq[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .select(RFQ_COLUMNS)
    .in("status", statuses)
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Rfq[];
}

export async function getRfqById(id: string): Promise<Rfq | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .select(RFQ_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Rfq | null) ?? null;
}

export async function updateRfqDraft(
  id: string,
  patch: RfqUpdate,
): Promise<Rfq> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(RFQ_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Rfq;
}

export async function setRfqStatus(
  id: string,
  status: RfqStatus,
  patch: { submitted_at?: string } = {},
): Promise<Rfq> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("rfqs")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", id)
    .select(RFQ_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Rfq;
}

// ---------- parts ----------

export async function listPartsForRfq(rfqId: string): Promise<Part[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("parts")
    .select(PART_COLUMNS)
    .eq("rfq_id", rfqId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Part[];
}

export async function createPart(
  rfqId: string,
  userId: string,
  input: PartUpsert,
): Promise<Part> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("parts")
    .insert({
      rfq_id: rfqId,
      created_by: userId,
      part_number: input.part_number,
      part_name: input.part_name ?? null,
      revision: input.revision ?? null,
      material: input.material ?? null,
      process_required: input.process_required ?? null,
      quantity: input.quantity ?? null,
      tolerance_notes: input.tolerance_notes ?? null,
      finish_requirements: input.finish_requirements ?? null,
      inspection_requirements: input.inspection_requirements ?? null,
    })
    .select(PART_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Part;
}

export async function deletePart(partId: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("parts").delete().eq("id", partId);
  if (error) throw new Error(error.message);
}

// ---------- internal ----------

function stripJoin<T extends Record<string, unknown>>(row: T): T {
  const copy: Record<string, unknown> = { ...row };
  delete copy.programs;
  return copy as T;
}
