/**
 * Routing intelligence — supplier ranking for a work package.
 *
 * Scoring is intentionally deterministic and explainable. Each fit dimension
 * lands on a 0-100 scale; a composite score weights them and the UI surfaces
 * the per-dimension scores plus a list of match/gap reasons so the admin can
 * see *why* a supplier ranks where it does. This is the v1 of the engine —
 * capability/compliance are computed from real data; capacity is a placeholder
 * that will tighten once we have load forecasts.
 */

export interface SupplierFitInputs {
  organization_id: string;
  organization_name: string;
  approval_status: string;
  as9100_certified: boolean;
  iso9001_certified: boolean;
  itar_registered: boolean;
  cmmc_status: string; // 'none' | 'level_1' | 'level_2' | 'level_3'
  capacity_notes: string | null;
  machines: Array<{
    machine_type: string;
    materials_supported: string[];
  }>;
  capabilities: Array<{
    process_type: string;
    materials_supported: string[];
  }>;
}

export interface PartRequirement {
  id: string;
  part_number: string;
  process_required: string | null;
  material: string | null;
}

export interface RfqContext {
  itar_required: boolean;
  cui_required: boolean;
}

export interface RankedCandidate {
  organization_id: string;
  organization_name: string;
  approval_status: string;
  itar_registered: boolean;
  as9100_certified: boolean;
  iso9001_certified: boolean;
  cmmc_status: string;
  capability_fit_score: number;
  compliance_fit_score: number;
  capacity_fit_score: number;
  composite_score: number;
  match_reasons: string[];
  gap_reasons: string[];
  /** True when supplier fails a hard requirement (e.g. ITAR). UI sorts these last. */
  blocked: boolean;
}

const COMPOSITE_WEIGHTS = {
  capability: 0.55,
  compliance: 0.3,
  capacity: 0.15,
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function tokenMatches(needle: string, haystack: string): boolean {
  const a = norm(needle);
  const b = norm(haystack);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

interface ProcessMatchResult {
  matched: boolean;
  matchedBy: string | null;
}

function findProcessMatch(
  required: string,
  supplier: SupplierFitInputs,
): ProcessMatchResult {
  for (const c of supplier.capabilities) {
    if (tokenMatches(required, c.process_type)) {
      return { matched: true, matchedBy: `capability "${c.process_type}"` };
    }
  }
  for (const m of supplier.machines) {
    if (tokenMatches(required, m.machine_type)) {
      return { matched: true, matchedBy: `machine "${m.machine_type}"` };
    }
  }
  return { matched: false, matchedBy: null };
}

function supportsMaterial(material: string, supplier: SupplierFitInputs): boolean {
  const target = norm(material);
  if (!target) return false;
  for (const c of supplier.capabilities) {
    if (c.materials_supported.some((m) => tokenMatches(target, m))) return true;
  }
  for (const m of supplier.machines) {
    if (m.materials_supported.some((mat) => tokenMatches(target, mat))) return true;
  }
  return false;
}

interface CapabilityScore {
  score: number;
  matchedProcesses: string[];
  unmatchedProcesses: string[];
  unmatchedMaterials: string[];
}

function scoreCapability(
  parts: PartRequirement[],
  supplier: SupplierFitInputs,
): CapabilityScore {
  if (parts.length === 0) {
    return {
      score: 50,
      matchedProcesses: [],
      unmatchedProcesses: [],
      unmatchedMaterials: [],
    };
  }

  let weighted = 0;
  let total = 0;
  const matchedProcesses = new Set<string>();
  const unmatchedProcesses = new Set<string>();
  const unmatchedMaterials = new Set<string>();

  for (const part of parts) {
    let partScore = 0;
    let dims = 0;
    if (part.process_required) {
      dims += 1;
      const m = findProcessMatch(part.process_required, supplier);
      if (m.matched) {
        partScore += 1;
        matchedProcesses.add(part.process_required);
      } else {
        unmatchedProcesses.add(part.process_required);
      }
    }
    if (part.material) {
      dims += 1;
      if (supportsMaterial(part.material, supplier)) {
        partScore += 1;
      } else {
        unmatchedMaterials.add(part.material);
      }
    }
    if (dims === 0) {
      // Part has no constraints declared — neither a help nor a hindrance.
      weighted += 50;
      total += 100;
    } else {
      weighted += (partScore / dims) * 100;
      total += 100;
    }
  }

  return {
    score: Math.round((weighted / total) * 100),
    matchedProcesses: [...matchedProcesses],
    unmatchedProcesses: [...unmatchedProcesses],
    unmatchedMaterials: [...unmatchedMaterials],
  };
}

interface ComplianceScore {
  score: number;
  blocked: boolean;
  matches: string[];
  gaps: string[];
}

function scoreCompliance(
  supplier: SupplierFitInputs,
  rfq: RfqContext,
): ComplianceScore {
  let score = 50;
  const matches: string[] = [];
  const gaps: string[] = [];
  let blocked = false;

  if (supplier.as9100_certified) {
    score += 20;
    matches.push("AS9100 certified");
  } else {
    gaps.push("Not AS9100 certified");
  }
  if (supplier.iso9001_certified) {
    score += 10;
    matches.push("ISO9001 certified");
  }
  if (supplier.itar_registered) {
    score += 10;
    matches.push("ITAR registered");
  }
  if (supplier.cmmc_status && supplier.cmmc_status !== "none") {
    score += 10;
    matches.push(`CMMC ${supplier.cmmc_status.replace("level_", "L")}`);
  }

  if (rfq.itar_required && !supplier.itar_registered) {
    blocked = true;
    score = Math.min(score, 25);
    gaps.unshift("RFQ requires ITAR registration");
  }
  if (rfq.cui_required && (!supplier.cmmc_status || supplier.cmmc_status === "none")) {
    blocked = true;
    score = Math.min(score, 25);
    gaps.unshift("RFQ involves CUI but supplier has no CMMC level");
  }

  return { score: Math.min(100, Math.max(0, score)), blocked, matches, gaps };
}

function scoreCapacity(supplier: SupplierFitInputs): {
  score: number;
  reason: string;
} {
  // Placeholder until we have real load/forecast signal. Use capacity_notes
  // as a weak positive signal when present.
  if (supplier.capacity_notes && supplier.capacity_notes.trim().length > 0) {
    return { score: 60, reason: "Capacity notes on file" };
  }
  return { score: 50, reason: "No capacity signal recorded" };
}

export function rankSupplier(
  supplier: SupplierFitInputs,
  parts: PartRequirement[],
  rfq: RfqContext,
): RankedCandidate {
  const capability = scoreCapability(parts, supplier);
  const compliance = scoreCompliance(supplier, rfq);
  const capacity = scoreCapacity(supplier);

  const composite = Math.round(
    capability.score * COMPOSITE_WEIGHTS.capability +
      compliance.score * COMPOSITE_WEIGHTS.compliance +
      capacity.score * COMPOSITE_WEIGHTS.capacity,
  );

  const match_reasons: string[] = [];
  const gap_reasons: string[] = [];

  if (capability.matchedProcesses.length > 0) {
    match_reasons.push(
      `Covers process: ${capability.matchedProcesses.slice(0, 4).join(", ")}`,
    );
  }
  if (capability.unmatchedProcesses.length > 0) {
    gap_reasons.push(
      `No declared capability for: ${capability.unmatchedProcesses
        .slice(0, 4)
        .join(", ")}`,
    );
  }
  if (capability.unmatchedMaterials.length > 0) {
    gap_reasons.push(
      `Material gap: ${capability.unmatchedMaterials.slice(0, 4).join(", ")}`,
    );
  }
  match_reasons.push(...compliance.matches);
  gap_reasons.push(...compliance.gaps);
  match_reasons.push(capacity.reason);

  return {
    organization_id: supplier.organization_id,
    organization_name: supplier.organization_name,
    approval_status: supplier.approval_status,
    itar_registered: supplier.itar_registered,
    as9100_certified: supplier.as9100_certified,
    iso9001_certified: supplier.iso9001_certified,
    cmmc_status: supplier.cmmc_status,
    capability_fit_score: capability.score,
    compliance_fit_score: compliance.score,
    capacity_fit_score: capacity.score,
    composite_score: composite,
    match_reasons,
    gap_reasons,
    blocked: compliance.blocked,
  };
}

export function rankSuppliers(
  suppliers: SupplierFitInputs[],
  parts: PartRequirement[],
  rfq: RfqContext,
): RankedCandidate[] {
  const ranked = suppliers.map((s) => rankSupplier(s, parts, rfq));
  ranked.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    return b.composite_score - a.composite_score;
  });
  return ranked;
}
