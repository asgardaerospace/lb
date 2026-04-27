// Pure scoring logic for customer applications.
// No DB / network access — readable, testable, deterministic.
//
// Six dimensions (sum of weights = 100):
//   compliance_complexity   10  (inverse-scored — high complexity = low score)
//   manufacturing_fit       20
//   program_maturity        15
//   production_volume       20
//   data_readiness          15
//   strategic_fit           20
//
// Composite is a weighted average → integer 0–100.
// Derived priority per the design rationale board:
//   85+ → P0, 70–84 → P1, 55–69 → P2, <55 → 'review'

import type {
  CustomerApplicationDetail,
  CustomerApplicationFull,
} from "./types";

export const SCORING_MODEL_KEY = "customer_fit";
export const SCORING_MODEL_VERSION = 2;

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  weight: number;
  score: number;
  detail: string;
}

export type DimensionKey =
  | "compliance_complexity"
  | "manufacturing_fit"
  | "program_maturity"
  | "production_volume"
  | "data_readiness"
  | "strategic_fit";

export const SCORING_WEIGHTS: Record<DimensionKey, number> = {
  compliance_complexity: 10,
  manufacturing_fit: 20,
  program_maturity: 15,
  production_volume: 20,
  data_readiness: 15,
  strategic_fit: 20,
};

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  compliance_complexity: "Compliance complexity",
  manufacturing_fit: "Manufacturing fit",
  program_maturity: "Program maturity",
  production_volume: "Production volume potential",
  data_readiness: "Data readiness",
  strategic_fit: "Strategic fit",
};

export type DerivedPriority = "P0" | "P1" | "P2" | "review";

export interface ScoreOutput {
  composite: number;
  priority: DerivedPriority;
  dimensions: DimensionScore[];
  riskFlags: string[];
  recommendedFocus: string[];
}

/**
 * Compute a fit score for a customer application from its full record
 * (parent + child rows). Pure function — same input always returns same
 * output.
 */
export function scoreCustomerApplication(
  full: CustomerApplicationFull,
): ScoreOutput {
  const a = full.application;

  const dimensions: DimensionScore[] = [
    {
      key: "compliance_complexity",
      label: DIMENSION_LABELS.compliance_complexity,
      weight: SCORING_WEIGHTS.compliance_complexity,
      ...computeComplianceComplexity(a),
    },
    {
      key: "manufacturing_fit",
      label: DIMENSION_LABELS.manufacturing_fit,
      weight: SCORING_WEIGHTS.manufacturing_fit,
      ...computeManufacturingFit(full),
    },
    {
      key: "program_maturity",
      label: DIMENSION_LABELS.program_maturity,
      weight: SCORING_WEIGHTS.program_maturity,
      ...computeProgramMaturity(full),
    },
    {
      key: "production_volume",
      label: DIMENSION_LABELS.production_volume,
      weight: SCORING_WEIGHTS.production_volume,
      ...computeProductionVolume(full),
    },
    {
      key: "data_readiness",
      label: DIMENSION_LABELS.data_readiness,
      weight: SCORING_WEIGHTS.data_readiness,
      ...computeDataReadiness(a),
    },
    {
      key: "strategic_fit",
      label: DIMENSION_LABELS.strategic_fit,
      weight: SCORING_WEIGHTS.strategic_fit,
      ...computeStrategicFit(a),
    },
  ];

  const composite = clamp(
    Math.round(
      dimensions.reduce((acc, d) => acc + (d.score * d.weight) / 100, 0),
    ),
    0,
    100,
  );
  const priority = priorityFor(composite);
  const riskFlags = computeRiskFlags(full);
  const recommendedFocus = computeRecommendedFocus(dimensions, full);

  return { composite, priority, dimensions, riskFlags, recommendedFocus };
}

// ──────────── Dimension calculators ────────────

function computeComplianceComplexity(a: CustomerApplicationDetail): {
  score: number;
  detail: string;
} {
  // Inverse-scored: more compliance burden = lower score = higher FDE cost.
  // Start at 100, subtract penalties.
  let score = 100;
  const drivers: string[] = [];
  if (a.itar) {
    score -= 15;
    drivers.push("ITAR (-15)");
  }
  if (a.cui) {
    score -= 15;
    drivers.push("CUI (-15)");
  }
  if (a.defense_program) {
    score -= 15;
    drivers.push("Defense program (-15)");
  }
  if (a.as9100) {
    score -= 10;
    drivers.push("AS9100D (-10)");
  }
  if (a.nadcap) {
    score -= 10;
    drivers.push("NADCAP (-10)");
  }
  const cmmcPenalty: Record<string, number> = {
    none: 0,
    level_1: 10,
    level_2: 20,
    level_3: 30,
  };
  const cmmc = cmmcPenalty[a.cmmc_level] ?? 0;
  if (cmmc > 0) {
    score -= cmmc;
    drivers.push(`CMMC ${a.cmmc_level} (-${cmmc})`);
  }
  return {
    score: clamp(score, 0, 100),
    detail: drivers.length
      ? `Compliance burden: ${drivers.join(", ")}`
      : "No compliance flags raised — low FDE lift.",
  };
}

function computeManufacturingFit(full: CustomerApplicationFull): {
  score: number;
  detail: string;
} {
  const n = full.processes.length;
  if (n === 0) {
    return {
      score: 10,
      detail:
        "No primary processes declared — routing match cannot be computed against the supplier network.",
    };
  }
  // Range: 1 process → 26, 2 → 42, 3 → 58, 4 → 74, 5+ → 90+. Cap 100.
  const score = clamp(10 + n * 16, 0, 100);
  return {
    score,
    detail: `${n} primary processes declared (CNC, composites, sheet metal, …) — covers ${score}% of network capability surface.`,
  };
}

function computeProgramMaturity(full: CustomerApplicationFull): {
  score: number;
  detail: string;
} {
  if (full.programs.length === 0) {
    return {
      score: 30,
      detail: "No active program types declared — limits demand-signal clarity.",
    };
  }
  const stageWeight: Record<string, number> = {
    concept: 25,
    prototype: 50,
    lrip: 75,
    production: 100,
  };
  const totalProgramWeight = full.programs.reduce(
    (acc, p) => acc + (stageWeight[p.stage] ?? 25),
    0,
  );
  const score = clamp(
    Math.round(totalProgramWeight / full.programs.length),
    0,
    100,
  );
  const stages = full.programs.map((p) => p.stage).join(", ");
  return {
    score,
    detail: `${full.programs.length} programs (${stages}) — average maturity ${score}/100.`,
  };
}

function computeProductionVolume(full: CustomerApplicationFull): {
  score: number;
  detail: string;
} {
  if (full.programs.length === 0) {
    return { score: 0, detail: "No active programs to estimate volume." };
  }
  const totalUnits = full.programs.reduce(
    (acc, p) => acc + (p.annual_volume ?? 0),
    0,
  );
  if (totalUnits === 0) {
    return {
      score: 15,
      detail: "Active programs declared but no annual volumes provided.",
    };
  }
  // Log-scale: 10u → ~30, 100u → ~60, 1k → ~90, 10k+ → 100.
  const score = clamp(
    Math.round(30 + 30 * Math.log10(Math.max(totalUnits, 1))),
    0,
    100,
  );
  return {
    score,
    detail: `~${totalUnits.toLocaleString()} units/yr across active programs.`,
  };
}

function computeDataReadiness(a: CustomerApplicationDetail): {
  score: number;
  detail: string;
} {
  const payload = a.payload as Record<string, unknown>;
  const data = (payload.data as Record<string, unknown>) ?? {};
  const cadSystems = asArray(data.cad_systems);
  const cadFormats = asArray(data.cad_formats);
  const plm = String(data.plm_system ?? "").trim();
  const mbd = data.model_based_definition === true;

  let score = 0;
  const drivers: string[] = [];
  if (cadSystems.length > 0) {
    score += 25;
    drivers.push("CAD systems declared");
  }
  if (cadFormats.length >= 2) {
    score += 25;
    drivers.push("multi-format export");
  } else if (cadFormats.length === 1) {
    score += 10;
    drivers.push("single CAD format");
  }
  if (mbd) {
    score += 25;
    drivers.push("MBD primary");
  }
  if (plm && plm !== "None" && plm !== "—") {
    score += 25;
    drivers.push(`PLM (${plm})`);
  }
  return {
    score: clamp(score, 0, 100),
    detail: drivers.length
      ? `Engineering data signals: ${drivers.join(", ")}.`
      : "No CAD/PLM/MBD signals — engineering data lift may be high.",
  };
}

function computeStrategicFit(a: CustomerApplicationDetail): {
  score: number;
  detail: string;
} {
  let score = 0;
  const drivers: string[] = [];
  if (a.defense_program) {
    score += 30;
    drivers.push("defense program (+30)");
  }
  if (a.itar) {
    score += 20;
    drivers.push("ITAR (+20)");
  }
  if (a.cui) {
    score += 15;
    drivers.push("CUI (+15)");
  }

  if (a.funding_stage === "series_b" || a.funding_stage === "series_c") {
    score += 20;
    drivers.push(`${a.funding_stage} (+20)`);
  } else if (a.funding_stage === "series_a") {
    score += 10;
    drivers.push("series_a (+10)");
  }

  if (a.org_type === "prime" || a.org_type === "oem") {
    score += 20;
    drivers.push(`${a.org_type} (+20)`);
  } else if (a.org_type === "gov") {
    score += 10;
    drivers.push("gov (+10)");
  } else if (
    a.org_type === "startup" &&
    (a.funding_stage === "series_b" || a.funding_stage === "series_c")
  ) {
    score += 15;
    drivers.push("scaling startup (+15)");
  }

  return {
    score: clamp(score, 0, 100),
    detail: drivers.length
      ? `Strategic signals: ${drivers.join(", ")}.`
      : "No strategic signals — generic commercial work.",
  };
}

// ──────────── Risk flags + focus recommendations ────────────

function computeRiskFlags(full: CustomerApplicationFull): string[] {
  const a = full.application;
  const flags: string[] = [];

  if (
    a.itar &&
    a.org_type === "startup" &&
    (a.funding_stage === "bootstrap" || a.funding_stage === "seed")
  ) {
    flags.push(
      "ITAR scope on a pre-Series-A startup — verify entity registration with DDTC.",
    );
  }
  if (a.defense_program && full.defense_programs.length === 0) {
    flags.push(
      "Defense program flag set but no named programs — request specific contract / OTA references.",
    );
  }
  if (a.defense_program && !a.itar) {
    flags.push(
      "Defense program declared without ITAR — confirm scope (commercial-only sub-tier?).",
    );
  }
  if (a.cmmc_level === "level_3") {
    flags.push(
      "CMMC Level 3 required — extended supplier qualification and likely audit involvement.",
    );
  }
  if (full.processes.length === 0) {
    flags.push("No primary processes declared — cannot compute routing match.");
  }
  const data = (a.payload as Record<string, unknown>).data as
    | Record<string, unknown>
    | undefined;
  if (!data || asArray(data?.cad_systems).length === 0) {
    flags.push("No CAD environment declared — file ingest path is unknown.");
  }
  if (
    a.suppliers_per_part === 1 &&
    (a.itar || a.defense_program)
  ) {
    flags.push(
      "Single-source sourcing requested for ITAR/defense work — confirm risk acceptance.",
    );
  }
  if (a.geography === "global" && a.itar) {
    flags.push(
      "Global geography with ITAR — these conflict; confirm export-controlled scope is US-person-only.",
    );
  }

  return flags;
}

function computeRecommendedFocus(
  dimensions: DimensionScore[],
  full: CustomerApplicationFull,
): string[] {
  const focus: string[] = [];
  // Two lowest-scoring dimensions get recommended focus, in score order.
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const weakest = sorted.slice(0, 2);
  for (const d of weakest) {
    if (d.score >= 80) continue; // both dims are strong; skip
    focus.push(`${d.label} — ${d.detail}`);
  }
  // Always surface defense_program-without-names as a focus item.
  if (full.application.defense_program && full.defense_programs.length === 0) {
    focus.push(
      "Confirm named defense program(s) before approval — required for FAR/DFARS template seeding.",
    );
  }
  if (focus.length === 0) {
    focus.push("All dimensions strong — proceed to FDE kickoff scheduling.");
  }
  return focus;
}

// ──────────── helpers ────────────

function priorityFor(composite: number): DerivedPriority {
  if (composite >= 85) return "P0";
  if (composite >= 70) return "P1";
  if (composite >= 55) return "P2";
  return "review";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// ──────────── Display helpers ────────────

export function priorityLabel(p: DerivedPriority): string {
  switch (p) {
    case "P0":
      return "P0 · White-glove";
    case "P1":
      return "P1 · Assigned FDE";
    case "P2":
      return "P2 · Self-serve";
    case "review":
      return "Needs review";
  }
}

export function priorityTone(p: DerivedPriority): "success" | "accent" | "info" | "warn" {
  switch (p) {
    case "P0":
      return "success";
    case "P1":
      return "accent";
    case "P2":
      return "info";
    case "review":
      return "warn";
  }
}
