import { createServerSupabase } from "@/lib/supabase/server";
import type {
  ProfileDraft,
  SupplierApprovalStatus,
  SupplierProfile,
} from "@/lib/supplier-profile/types";

const COLUMNS =
  "id, organization_id, approval_status, company_summary, facility_size_sqft, employee_count, quality_system_notes, capacity_notes, as9100_certified, iso9001_certified, itar_registered, cmmc_status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, created_by";

export async function getProfileForOrg(
  organizationId: string,
): Promise<SupplierProfile | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("supplier_profiles")
    .select(COLUMNS)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SupplierProfile | null) ?? null;
}

export async function getProfileById(
  id: string,
): Promise<SupplierProfile | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("supplier_profiles")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SupplierProfile | null) ?? null;
}

export async function upsertDraft(
  organizationId: string,
  userId: string,
  draft: ProfileDraft,
): Promise<SupplierProfile> {
  const supabase = await createServerSupabase();
  const existing = await getProfileForOrg(organizationId);

  if (existing) {
    const { data, error } = await supabase
      .from("supplier_profiles")
      .update({ ...draft, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return data as SupplierProfile;
  }

  const { data, error } = await supabase
    .from("supplier_profiles")
    .insert({
      organization_id: organizationId,
      approval_status: "draft",
      created_by: userId,
      ...draft,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as SupplierProfile;
}

export async function setStatus(
  id: string,
  nextStatus: SupplierApprovalStatus,
  patch: {
    reviewed_by?: string;
    review_notes?: string | null;
    submitted_at?: string | null;
    reviewed_at?: string | null;
  } = {},
): Promise<SupplierProfile> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("supplier_profiles")
    .update({
      approval_status: nextStatus,
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as SupplierProfile;
}

export async function listByStatus(
  statuses: SupplierApprovalStatus[],
): Promise<SupplierProfile[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("supplier_profiles")
    .select(COLUMNS)
    .in("approval_status", statuses)
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SupplierProfile[];
}
