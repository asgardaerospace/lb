// Pure scoring logic for supplier applications.
// No DB / network access — readable, testable, deterministic.
//
// Seven dimensions (sum of weights = 100):
//   compliance              15
//   capability_breadth      20
//   machine_sophistication  15
//   past_performance        20
//   workforce_scale         10
//   quality_indicators      10
//   specialization          10
//
// Composite is a clamped weighted average → integer 0–100.
// Recommendation bands:
//   85+ → routing-ready
//   70–84 → qualified
//   55–69 → conditional
//   <55 → defer

import type { SupplierApplicationFull } from "./types";

export const SCORING_MODEL_KEY = "supplier_readiness";
export const SCORING_MODEL_VERSION = 2;

export type DimensionKey =
  | "compliance"
  | "capability_breadth"
  | "machine_sophistication"
  | "past_performance"
  | "workforce_scale"
  | "quality_indicators"
  | "specialization";

export const SCORING_WEIGHTS: Record<DimensionKey, number> = {
  compliance: 15,
  capability_breadth: 20,
  machine_sophistication: 15,
  past_performance: 20,
  workforce_scale: 10,
  quality_indicators: 10,
  specialization: 10,
};

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  compliance: "Compliance",
  capability_breadth: "Capability breadth",
  machine_sophistication: "Machine sophistication",
  past_performance: "Past performance",
  workforce_scale: "Workforce scale",
  quality_indicators: "Quality indicators",
  specialization: "Specialization vs generalization",
};

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  weight: number;
  score: number;
  detail: string;
}

export type DerivedRecommendation =
  | "routing_ready"
  | "qualified"
  | "conditional"
  | "defer";

export interface ScoreOutput {
  composite: number;
  recommendation: DerivedRecommendation;
  dimensions: DimensionScore[];
  riskFlags: string[];
  strengths: string[];
  tags: string[];
}

export function scoreSupplierApplication(
  full: SupplierApplicationFull,
): ScoreOutput {
  const dimensions: DimensionScore[] = [
    {
      key: "compliance",
      label: DIMENSION_LABELS.compliance,
      weight: SCORING_WEIGHTS.compliance,
      ...computeCompliance(full),
    },
    {
      key: "capability_breadth",
      label: DIMENSION_LABELS.capability_breadth,
      weight: SCORING_WEIGHTS.capability_breadth,
      ...computeCapabilityBreadth(full),
    },
    {
      key: "machine_sophistication",
      label: DIMENSION_LABELS.machine_sophistication,
      weight: SCORING_WEIGHTS.machine_sophistication,
      ...computeMachineSophistication(full),
    },
    {
      key: "past_performance",
      label: DIMENSION_LABELS.past_performance,
      weight: SCORING_WEIGHTS.past_performance,
      ...computePastPerformance(full),
    },
    {
      key: "workforce_scale",
      label: DIMENSION_LABELS.workforce_scale,
      weight: SCORING_WEIGHTS.workforce_scale,
      ...computeWorkforceScale(full),
    },
    {
      key: "quality_indicators",
      label: DIMENSION_LABELS.quality_indicators,
      weight: SCORING_WEIGHTS.quality_indicators,
      ...computeQualityIndicators(full),
    },
    {
      key: "specialization",
      label: DIMENSION_LABELS.specialization,
      weight: SCORING_WEIGHTS.specialization,
      ...computeSpecialization(full),
    },
  ];

  const composite = clamp(
    Math.round(
      dimensions.reduce((acc, d) => acc + (d.score * d.weight) / 100, 0),
    ),
    0,
    100,
  );
  const recommendation = recommendationFor(composite);
  const riskFlags = computeRiskFlags(full);
  const strengths = computeStrengths(full, dimensions);
  const tags = computeTags(full);

  return { composite, recommendation, dimensions, riskFlags, strengths, tags };
}

// ──────────── Dimension calculators ────────────

function computeCompliance(full: SupplierApplicationFull) {
  const a = full.application;
  let score = 0;
  const drivers: string[] = [];
  if (a.itar_registered) {
    score += 30;
    drivers.push("ITAR (+30)");
  }
  const cmmc = { none: 0, level_1: 20, level_2: 40, level_3: 60 }[a.cmmc_level] ?? 0;
  if (cmmc > 0) {
    score += cmmc;
    drivers.push(`CMMC ${a.cmmc_level} (+${cmmc})`);
  }
  const certTypes = full.certifications.map((c) => c.cert_type.toUpperCase());
  if (certTypes.some((c) => c.includes("AS9100"))) {
    score += 20;
    drivers.push("AS9100D (+20)");
  }
  if (certTypes.some((c) => c.includes("NADCAP") || c.includes("AC7"))) {
    score += 10;
    drivers.push("NADCAP (+10)");
  }
  return {
    score: clamp(score, 0, 100),
    detail: drivers.length
      ? `Compliance signals: ${drivers.join(", ")}.`
      : "No compliance signals — limits routing eligibility.",
  };
}

function computeCapabilityBreadth(full: SupplierApplicationFull) {
  if (full.capabilities.length === 0) {
    return {
      score: 5,
      detail: "No capabilities declared — cannot match against routing.",
    };
  }
  const processes = new Set(
    full.capabilities.map((c) => c.process_type.toLowerCase()),
  );
  const materials = new Set<string>();
  for (const c of full.capabilities) {
    for (const m of c.materials ?? []) materials.add(m.toLowerCase());
  }
  const score = clamp(processes.size * 12 + materials.size * 4, 0, 100);
  return {
    score,
    detail: `${processes.size} distinct process${processes.size === 1 ? "" : "es"} · ${materials.size} material${
      materials.size === 1 ? "" : "s"
    } across capabilities.`,
  };
}

function computeMachineSophistication(full: SupplierApplicationFull) {
  if (full.machines.length === 0) {
    return {
      score: 5,
      detail:
        "No machines declared — capacity match unclear before approval.",
    };
  }
  let pts = 0;
  let fiveAxis = 0;
  let withTol = 0;
  for (const m of full.machines) {
    if (m.axis_count != null && m.axis_count >= 5) {
      pts += 25;
      fiveAxis += 1;
    } else if (m.axis_count === 4) {
      pts += 15;
    } else if (m.axis_count === 3) {
      pts += 8;
    } else {
      pts += 5;
    }
    if (m.tolerance_capability && m.tolerance_capability.trim()) {
      withTol += 1;
    }
  }
  pts += Math.min(20, full.machines.length * 5);
  if (withTol > 0) pts += 10;
  const score = clamp(pts, 0, 100);
  return {
    score,
    detail: `${full.machines.length} machines · ${fiveAxis} 5-axis · ${withTol} with declared tolerance.`,
  };
}

function computePastPerformance(full: SupplierApplicationFull) {
  const n = full.past_performance.length;
  if (n === 0) {
    return {
      score: 10,
      detail:
        "No past program references — caution for high-value or flight-hardware RFQs.",
    };
  }
  const base = n >= 6 ? 90 : n >= 3 ? 60 : 30;
  let bonus = 0;
  const values = full.past_performance
    .map((p) => Number(p.contract_value_usd ?? 0))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (values.some((v) => v >= 10_000_000)) {
    bonus = 20;
  } else if (values.some((v) => v >= 1_000_000)) {
    bonus = 10;
  }
  const score = clamp(base + bonus, 0, 100);
  const totalUsd = values.reduce((a, b) => a + b, 0);
  return {
    score,
    detail: `${n} prior program${n === 1 ? "" : "s"}${
      totalUsd > 0
        ? ` · $${(totalUsd / 1_000_000).toFixed(1)}M total declared value`
        : ""
    }.`,
  };
}

function computeWorkforceScale(full: SupplierApplicationFull) {
  const t = full.application.team_size;
  if (t == null) {
    return {
      score: 30,
      detail: "Team size not declared.",
    };
  }
  const bucket =
    t < 5 ? 20 : t < 26 ? 50 : t < 101 ? 80 : 100;
  return {
    score: bucket,
    detail: `${t} people on team.`,
  };
}

function computeQualityIndicators(full: SupplierApplicationFull) {
  const n = full.certifications.length;
  if (n === 0) {
    return {
      score: 10,
      detail: "No certifications declared.",
    };
  }
  const score = clamp(n * 20, 0, 100);
  const expiringSoon = full.certifications.filter((c) => {
    if (!c.expiration_date) return false;
    const exp = new Date(c.expiration_date).getTime();
    if (!Number.isFinite(exp)) return false;
    return exp - Date.now() < 1000 * 60 * 60 * 24 * 90; // 90 days
  });
  return {
    score,
    detail: `${n} certification${n === 1 ? "" : "s"}${
      expiringSoon.length > 0
        ? ` · ${expiringSoon.length} expiring within 90 days`
        : ""
    }.`,
  };
}

function computeSpecialization(full: SupplierApplicationFull) {
  if (full.capabilities.length === 0) {
    return {
      score: 30,
      detail: "Cannot classify — no capabilities declared.",
    };
  }
  const processes = new Set(
    full.capabilities.map((c) => c.process_type.toLowerCase()),
  );
  const avgMaterials =
    full.capabilities.reduce((acc, c) => acc + (c.materials?.length ?? 0), 0) /
    full.capabilities.length;
  const procCount = processes.size;

  if (procCount >= 4 && avgMaterials >= 2) {
    return {
      score: 95,
      detail: `Accomplished generalist — ${procCount} processes, avg ${avgMaterials.toFixed(1)} materials per capability.`,
    };
  }
  if (procCount >= 3 && avgMaterials >= 2) {
    return {
      score: 90,
      detail: `Generalist — ${procCount} processes, avg ${avgMaterials.toFixed(1)} materials per capability.`,
    };
  }
  if (procCount <= 2 && avgMaterials >= 3) {
    return {
      score: 80,
      detail: `Specialist — ${procCount} process${procCount === 1 ? "" : "es"} with deep material coverage (avg ${avgMaterials.toFixed(1)}).`,
    };
  }
  return {
    score: 40,
    detail: `Capability shape unclear — ${procCount} process${procCount === 1 ? "" : "es"}, avg ${avgMaterials.toFixed(1)} materials per capability.`,
  };
}

// ──────────── Risk flags / strengths / tags ────────────

function computeRiskFlags(full: SupplierApplicationFull): string[] {
  const a = full.application;
  const certTypes = full.certifications.map((c) => c.cert_type.toUpperCase());
  const flags: string[] = [];

  if (full.capabilities.length === 0) {
    flags.push(
      "No capabilities declared — cannot match against routing requirements.",
    );
  }
  if (full.machines.length === 0) {
    flags.push(
      "No machine inventory — capacity match unclear before approval.",
    );
  }
  if (a.itar_registered && !certTypes.some((c) => c.includes("AS9100"))) {
    flags.push(
      "ITAR registered but no AS9100 listed — verify aerospace QMS coverage.",
    );
  }
  if (a.itar_registered && full.certifications.length === 0) {
    flags.push(
      "ITAR registered with zero certifications declared — likely incomplete intake.",
    );
  }
  if (full.past_performance.length === 0) {
    flags.push(
      "No past program references — caution before flight-hardware or high-value RFQs.",
    );
  }
  if (
    full.machines.length > 0 &&
    full.machines.every((m) => m.axis_count == null)
  ) {
    flags.push(
      "Machine sophistication unknown — no axis counts provided across the inventory.",
    );
  }
  const expired = full.certifications.filter(
    (c) =>
      c.expiration_date &&
      new Date(c.expiration_date).getTime() < Date.now(),
  );
  if (expired.length > 0) {
    flags.push(
      `${expired.length} certification${expired.length === 1 ? " has" : "s have"} already expired — request renewal before approval.`,
    );
  }
  return flags;
}

function computeStrengths(
  full: SupplierApplicationFull,
  dimensions: DimensionScore[],
): string[] {
  const a = full.application;
  const strengths: string[] = [];
  const dim = (k: DimensionKey) => dimensions.find((d) => d.key === k);

  const compliance = dim("compliance");
  if (compliance && compliance.score >= 80) {
    const bits: string[] = [];
    if (a.itar_registered) bits.push("ITAR");
    if (a.cmmc_level !== "none") bits.push(`CMMC ${a.cmmc_level.replace("_", " ")}`);
    if (
      full.certifications.some((c) =>
        c.cert_type.toUpperCase().includes("AS9100"),
      )
    ) {
      bits.push("AS9100");
    }
    if (bits.length > 0) {
      strengths.push(`Compliance: ${bits.join(" + ")}`);
    }
  }

  const ms = dim("machine_sophistication");
  const fiveAxis = full.machines.filter(
    (m) => m.axis_count != null && m.axis_count >= 5,
  ).length;
  if (ms && ms.score >= 70 && fiveAxis > 0) {
    strengths.push(`${fiveAxis} 5-axis machine${fiveAxis === 1 ? "" : "s"} on the floor`);
  }

  const pp = dim("past_performance");
  if (pp && pp.score >= 70 && full.past_performance.length > 0) {
    const totalUsd = full.past_performance
      .map((p) => Number(p.contract_value_usd ?? 0))
      .filter((v) => Number.isFinite(v) && v > 0)
      .reduce((acc, v) => acc + v, 0);
    if (totalUsd > 0) {
      strengths.push(
        `$${(totalUsd / 1_000_000).toFixed(1)}M+ across ${full.past_performance.length} programs`,
      );
    } else {
      strengths.push(
        `${full.past_performance.length} prior program references`,
      );
    }
  }

  const cb = dim("capability_breadth");
  if (cb && cb.score >= 70) {
    const proc = new Set(full.capabilities.map((c) => c.process_type)).size;
    const mat = new Set(full.capabilities.flatMap((c) => c.materials)).size;
    strengths.push(`${proc} processes spanning ${mat} materials`);
  }

  if (strengths.length === 0) {
    strengths.push(
      "No standout strengths yet — score will lift as capabilities, machines, and past performance are completed.",
    );
  }
  return strengths;
}

function computeTags(full: SupplierApplicationFull): string[] {
  const a = full.application;
  const tags: string[] = [];
  if (a.itar_registered) tags.push("ITAR-routing");
  if (a.cmmc_level === "level_2" || a.cmmc_level === "level_3") {
    tags.push(`CMMC ${a.cmmc_level.replace("_", " ")}`);
  }
  if (full.certifications.some((c) =>
    c.cert_type.toUpperCase().includes("AS9100"),
  )) {
    tags.push("AS9100-flight-hardware");
  }
  if (
    full.machines.filter(
      (m) => m.axis_count != null && m.axis_count >= 5,
    ).length >= 2
  ) {
    tags.push("Multi-5-axis");
  }
  if (full.machines.length >= 8) {
    tags.push("High-volume capable");
  }

  const processes = new Set(
    full.capabilities.map((c) => c.process_type.toLowerCase()),
  ).size;
  const avgMaterials =
    full.capabilities.length > 0
      ? full.capabilities.reduce(
          (acc, c) => acc + (c.materials?.length ?? 0),
          0,
        ) / full.capabilities.length
      : 0;
  if (processes <= 2 && avgMaterials >= 3) {
    tags.push("Specialist");
  } else if (processes >= 4 && avgMaterials >= 2) {
    tags.push("Generalist");
  }

  if (full.past_performance.length === 0) {
    tags.push("No past performance");
  }
  return tags;
}

// ──────────── helpers ────────────

function recommendationFor(composite: number): DerivedRecommendation {
  if (composite >= 85) return "routing_ready";
  if (composite >= 70) return "qualified";
  if (composite >= 55) return "conditional";
  return "defer";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ──────────── Display helpers ────────────

export function recommendationLabel(r: DerivedRecommendation): string {
  switch (r) {
    case "routing_ready":
      return "Routing-ready";
    case "qualified":
      return "Qualified";
    case "conditional":
      return "Conditional";
    case "defer":
      return "Defer";
  }
}

export function recommendationTone(
  r: DerivedRecommendation,
): "success" | "accent" | "info" | "warn" {
  switch (r) {
    case "routing_ready":
      return "success";
    case "qualified":
      return "accent";
    case "conditional":
      return "info";
    case "defer":
      return "warn";
  }
}
