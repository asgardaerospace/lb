import { createServerSupabase } from "@/lib/supabase/server";
import type { Job, JobStatus } from "@/lib/jobs/types";

const JOB_COLUMNS =
  "id, job_number, work_package_id, supplier_organization_id, quote_id, status, start_date, due_date, completed_date, last_issue_note, last_issue_flagged_at, created_at, updated_at, created_by";

export async function getJobById(id: string): Promise<Job | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Job | null) ?? null;
}

export async function listJobsForSupplier(
  supplierOrgId: string,
): Promise<Job[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("supplier_organization_id", supplierOrgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}

export async function listAllJobs(): Promise<Job[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}

// Jobs visible to a buyer org: join via work_package → rfq → program, and
// filter where program.buyer_organization_id = buyerOrgId.
export async function listJobsForBuyer(
  buyerOrgId: string,
): Promise<Job[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `${JOB_COLUMNS},
       work_packages!inner(
         id, rfqs!inner(
           id, programs!inner(id, buyer_organization_id)
         )
       )`,
    )
    .eq("work_packages.rfqs.programs.buyer_organization_id", buyerOrgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(stripJoin) as Job[];
}

interface UpdateJobPatch {
  status?: JobStatus;
  start_date?: string | null;
  completed_date?: string | null;
  last_issue_note?: string | null;
  last_issue_flagged_at?: string | null;
}

export async function updateJob(id: string, patch: UpdateJobPatch): Promise<Job> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(JOB_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Job;
}

// ---------- internal ----------

function stripJoin<T extends Record<string, unknown>>(row: T): T {
  const copy: Record<string, unknown> = { ...row };
  delete copy.work_packages;
  return copy as T;
}
