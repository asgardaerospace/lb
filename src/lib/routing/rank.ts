import { createServiceSupabase } from "@/lib/supabase/server";
import { listPartsForWorkPackage } from "./repository";
import {
  rankSuppliers,
  type PartRequirement,
  type RankedCandidate,
  type RfqContext,
  type SupplierFitInputs,
} from "./scoring";

interface SupplierProfileRow {
  organization_id: string;
  approval_status: string;
  as9100_certified: boolean;
  iso9001_certified: boolean;
  itar_registered: boolean;
  cmmc_status: string;
  capacity_notes: string | null;
  organizations: { name: string } | { name: string }[] | null;
}

interface MachineRow {
  organization_id: string;
  machine_type: string;
  materials_supported: string[];
}

interface CapabilityRow {
  organization_id: string;
  process_type: string;
  materials_supported: string[];
}

/**
 * Load every approved supplier with its machines + capabilities, then rank
 * them against the work package's parts and RFQ compliance flags.
 */
export async function rankCandidatesForWorkPackage(
  workPackageId: string,
): Promise<RankedCandidate[]> {
  const sb = createServiceSupabase();

  // Resolve work_package → rfq → program for compliance flags. RFQ-level
  // overrides win when set; otherwise the program defaults apply.
  const { data: wpRow, error: wpErr } = await sb
    .from("work_packages")
    .select(
      "id, rfq_id, rfqs(itar_override, cui_override, programs(itar_controlled, cui_controlled))",
    )
    .eq("id", workPackageId)
    .maybeSingle();
  if (wpErr) throw new Error(`Work package fetch failed: ${wpErr.message}`);
  if (!wpRow) return [];

  type ProgramFlags = { itar_controlled: boolean; cui_controlled: boolean };
  type RfqFlags = {
    itar_override: boolean | null;
    cui_override: boolean | null;
    programs: ProgramFlags | ProgramFlags[] | null;
  };
  type RfqsJoin = RfqFlags | RfqFlags[] | null;
  const wpJoined = wpRow as unknown as { rfqs: RfqsJoin };
  const rfqs = Array.isArray(wpJoined.rfqs) ? wpJoined.rfqs[0] : wpJoined.rfqs;
  const programsRaw = rfqs?.programs ?? null;
  const program = Array.isArray(programsRaw) ? programsRaw[0] : programsRaw;
  const itarFromProgram = Boolean(program?.itar_controlled);
  const cuiFromProgram = Boolean(program?.cui_controlled);
  const rfqContext: RfqContext = {
    itar_required: rfqs?.itar_override ?? itarFromProgram,
    cui_required: rfqs?.cui_override ?? cuiFromProgram,
  };

  const partsRaw = await listPartsForWorkPackage(workPackageId);
  const parts: PartRequirement[] = partsRaw.map((p) => ({
    id: p.id,
    part_number: p.part_number,
    process_required: p.process_required,
    material: p.material,
  }));

  const [profileRes, machineRes, capabilityRes] = await Promise.all([
    sb
      .from("supplier_profiles")
      .select(
        "organization_id, approval_status, as9100_certified, iso9001_certified, itar_registered, cmmc_status, capacity_notes, organizations(name)",
      )
      .eq("approval_status", "approved"),
    sb.from("machines").select("organization_id, machine_type, materials_supported"),
    sb
      .from("capabilities")
      .select("organization_id, process_type, materials_supported"),
  ]);

  if (profileRes.error) {
    throw new Error(`Profile list failed: ${profileRes.error.message}`);
  }

  const profiles = (profileRes.data ?? []) as unknown as SupplierProfileRow[];
  const machines = (machineRes.data ?? []) as MachineRow[];
  const capabilities = (capabilityRes.data ?? []) as CapabilityRow[];

  const machinesByOrg = new Map<
    string,
    Array<{ machine_type: string; materials_supported: string[] }>
  >();
  for (const m of machines) {
    const list = machinesByOrg.get(m.organization_id) ?? [];
    list.push({
      machine_type: m.machine_type,
      materials_supported: m.materials_supported ?? [],
    });
    machinesByOrg.set(m.organization_id, list);
  }

  const capByOrg = new Map<
    string,
    Array<{ process_type: string; materials_supported: string[] }>
  >();
  for (const c of capabilities) {
    const list = capByOrg.get(c.organization_id) ?? [];
    list.push({
      process_type: c.process_type,
      materials_supported: c.materials_supported ?? [],
    });
    capByOrg.set(c.organization_id, list);
  }

  const suppliers: SupplierFitInputs[] = profiles.map((p) => {
    const org = Array.isArray(p.organizations) ? p.organizations[0] : p.organizations;
    return {
      organization_id: p.organization_id,
      organization_name: org?.name ?? "(unknown)",
      approval_status: p.approval_status,
      as9100_certified: p.as9100_certified,
      iso9001_certified: p.iso9001_certified,
      itar_registered: p.itar_registered,
      cmmc_status: p.cmmc_status,
      capacity_notes: p.capacity_notes,
      machines: machinesByOrg.get(p.organization_id) ?? [],
      capabilities: capByOrg.get(p.organization_id) ?? [],
    };
  });

  return rankSuppliers(suppliers, parts, rfqContext);
}
