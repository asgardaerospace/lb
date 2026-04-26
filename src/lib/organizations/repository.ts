import { createServiceSupabase } from "@/lib/supabase/server";

export type OrganizationType = "asgard" | "supplier" | "buyer";
export type SupplierApprovalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "revisions_requested";

export interface OrganizationDirectoryRow {
  id: string;
  name: string;
  type: OrganizationType;
  itar_registered: boolean;
  created_at: string;
  user_count: number;
  // supplier-only
  supplier_approval_status: SupplierApprovalStatus | null;
  as9100_certified: boolean | null;
  iso9001_certified: boolean | null;
  cmmc_status: string | null;
  // activity
  jobs_count: number;
  programs_count: number;
  rfqs_count: number;
}

interface OrgRow {
  id: string;
  name: string;
  type: OrganizationType;
  itar_registered: boolean;
  created_at: string;
}

interface UserRow {
  organization_id: string;
}

interface SupplierProfileRow {
  organization_id: string;
  approval_status: SupplierApprovalStatus;
  as9100_certified: boolean;
  iso9001_certified: boolean;
  cmmc_status: string;
}

interface JobRow {
  supplier_organization_id: string;
}

interface ProgramRow {
  id: string;
  buyer_organization_id: string;
}

interface RfqRow {
  program_id: string;
}

function tally<T>(rows: T[], key: (row: T) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/**
 * Fetches every organization with aggregate counts (users, jobs, programs, RFQs)
 * and supplier-profile approval/cert state. Done with a handful of full-table
 * scans rather than row-by-row joins: the directory is admin-only and the
 * cardinality stays small (org count is tens, not millions).
 */
export async function listOrganizationsForDirectory(): Promise<
  OrganizationDirectoryRow[]
> {
  const sb = createServiceSupabase();

  const [orgRes, userRes, profileRes, jobRes, programRes, rfqRes] = await Promise.all([
    sb.from("organizations").select("id, name, type, itar_registered, created_at"),
    sb.from("users").select("organization_id"),
    sb
      .from("supplier_profiles")
      .select(
        "organization_id, approval_status, as9100_certified, iso9001_certified, cmmc_status",
      ),
    sb.from("jobs").select("supplier_organization_id"),
    sb.from("programs").select("id, buyer_organization_id"),
    sb.from("rfqs").select("program_id"),
  ]);

  if (orgRes.error) throw new Error(`Org list failed: ${orgRes.error.message}`);

  const orgs = (orgRes.data ?? []) as OrgRow[];
  const users = (userRes.data ?? []) as UserRow[];
  const profiles = (profileRes.data ?? []) as SupplierProfileRow[];
  const jobs = (jobRes.data ?? []) as JobRow[];
  const programs = (programRes.data ?? []) as ProgramRow[];
  const rfqs = (rfqRes.data ?? []) as RfqRow[];

  const userByOrg = tally(users, (r) => r.organization_id);
  const jobByOrg = tally(jobs, (r) => r.supplier_organization_id);
  const programByOrg = tally(programs, (r) => r.buyer_organization_id);

  const programToBuyer = new Map<string, string>();
  for (const p of programs) programToBuyer.set(p.id, p.buyer_organization_id);
  const rfqByBuyer = tally(rfqs, (r) => programToBuyer.get(r.program_id) ?? null);

  const profileByOrg = new Map<string, SupplierProfileRow>();
  for (const p of profiles) profileByOrg.set(p.organization_id, p);

  return orgs
    .map((o) => {
      const profile = profileByOrg.get(o.id);
      return {
        id: o.id,
        name: o.name,
        type: o.type,
        itar_registered: o.itar_registered,
        created_at: o.created_at,
        user_count: userByOrg.get(o.id) ?? 0,
        supplier_approval_status: profile?.approval_status ?? null,
        as9100_certified: profile?.as9100_certified ?? null,
        iso9001_certified: profile?.iso9001_certified ?? null,
        cmmc_status: profile?.cmmc_status ?? null,
        jobs_count: jobByOrg.get(o.id) ?? 0,
        programs_count: programByOrg.get(o.id) ?? 0,
        rfqs_count: rfqByBuyer.get(o.id) ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
