import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * Defaults derived from a customer's onboarding intake. Used to pre-fill
 * the first program / RFQ forms after activation so the buyer doesn't
 * re-type things they already told us during onboarding.
 *
 * `null` if the user's organization isn't tied to a converted customer
 * application (e.g. legacy buyer organizations created before the intake
 * flow existed).
 */
export interface IntakeDefaults {
  application_id: string;
  customer_profile_id: string;
  legal_name: string;
  // Headline compliance flags lifted from the intake row.
  itar: boolean;
  cui: boolean;
  cmmc_level: string;
  // First active program declared during intake — used as the default for
  // the buyer's "first program" form. Falls back to nulls when no programs
  // were declared.
  suggested_program_name: string | null;
  suggested_program_type: string | null; // e.g. "Defense", "UAS"
  suggested_lifecycle_stage: string | null; // e.g. "LRIP", "Production"
  // Distinct manufacturing processes from intake — surfaced as hints.
  primary_processes: string[];
  // Total program count + flags so the dashboard can decide between
  // "first program" wording and "next program" wording.
  intake_program_count: number;
}

// Map onboarding-wizard program categories to the chip values rendered in
// /buyer/programs/new (MISSION_TYPES). Values not present in MISSION_TYPES
// are mapped to the closest match so the chip pre-selects cleanly.
const PROGRAM_CATEGORY_LABEL: Record<string, string> = {
  uas: "ISR",
  evtol: "eVTOL",
  satellite: "Satellite",
  launch: "Propulsion",
  defense: "Defense",
  aircraft: "Aviation",
  ground: "Other",
};

const STAGE_LABEL: Record<string, string> = {
  concept: "Prototype",
  prototype: "Prototype",
  lrip: "LRIP",
  production: "Production",
};

/**
 * Resolves the intake defaults bundle for an organization. Best-effort —
 * returns null on any failure so callers can fall back to vanilla defaults.
 */
export async function getIntakeDefaultsForOrganization(
  organizationId: string,
): Promise<IntakeDefaults | null> {
  try {
    const supabase = createServiceSupabase();
    const profileRes = await supabase
      .from("customer_profiles")
      .select("id, source_application_id")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (profileRes.error || !profileRes.data) return null;
    const profile = profileRes.data as {
      id: string;
      source_application_id: string | null;
    };
    if (!profile.source_application_id) return null;

    const [appRes, programsRes, processesRes] = await Promise.all([
      supabase
        .from("customer_applications")
        .select("legal_name, itar, cui, cmmc_level")
        .eq("id", profile.source_application_id)
        .maybeSingle(),
      supabase
        .from("customer_application_programs")
        .select("program_category, stage, annual_volume")
        .eq("application_id", profile.source_application_id)
        .order("annual_volume", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("customer_application_processes")
        .select("process_type")
        .eq("application_id", profile.source_application_id)
        .order("process_type", { ascending: true }),
    ]);

    if (appRes.error || !appRes.data) return null;

    const programs = (programsRes.data ?? []) as Array<{
      program_category: string;
      stage: string;
      annual_volume: number | null;
    }>;
    const processes = (processesRes.data ?? []) as Array<{
      process_type: string;
    }>;

    const top = programs[0] ?? null;
    const suggestedType = top
      ? PROGRAM_CATEGORY_LABEL[top.program_category] ?? top.program_category
      : null;
    const suggestedStage = top ? STAGE_LABEL[top.stage] ?? null : null;

    const app = appRes.data as {
      legal_name: string;
      itar: boolean;
      cui: boolean;
      cmmc_level: string;
    };

    const suggestedName = top
      ? `${app.legal_name} · ${suggestedType ?? top.program_category}`
      : null;

    return {
      application_id: profile.source_application_id,
      customer_profile_id: profile.id,
      legal_name: app.legal_name,
      itar: !!app.itar,
      cui: !!app.cui,
      cmmc_level: app.cmmc_level,
      suggested_program_name: suggestedName,
      suggested_program_type: suggestedType,
      suggested_lifecycle_stage: suggestedStage,
      primary_processes: processes.map((p) => p.process_type),
      intake_program_count: programs.length,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[customer-application] intake defaults fetch failed:",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  }
}
