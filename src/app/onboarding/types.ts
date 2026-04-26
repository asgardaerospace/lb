export type StepId =
  | "company"
  | "programs"
  | "manufacturing"
  | "compliance"
  | "program_chars"
  | "supply_chain"
  | "data"
  | "first_use"
  | "review";

export interface StepDef {
  id: StepId;
  num: string;
  title: string;
  meta: string;
}

export const STEPS: StepDef[] = [
  { id: "company", num: "01", title: "Company Profile", meta: "Entity, contacts, funding" },
  { id: "programs", num: "02", title: "Program Types", meta: "What you build, stage, volume" },
  { id: "manufacturing", num: "03", title: "Manufacturing Needs", meta: "Processes, complexity, lots" },
  { id: "compliance", num: "04", title: "Compliance Requirements", meta: "ITAR, CUI, AS9100, NADCAP" },
  { id: "program_chars", num: "05", title: "Program Characteristics", meta: "Lead, schedule, risk posture" },
  { id: "supply_chain", num: "06", title: "Supply Chain Preferences", meta: "Geography, sourcing posture" },
  { id: "data", num: "07", title: "Data & Integration", meta: "CAD, PLM, ERP, file transfer" },
  { id: "first_use", num: "08", title: "Initial Use Case", meta: "How you'll start in Launchbelt" },
  { id: "review", num: "09", title: "Review & Confirm", meta: "Configure & launch workspace" },
];

export type OrgType = "startup" | "prime" | "oem" | "enterprise" | "gov";
export type FundingStage = "bootstrap" | "seed" | "series_a" | "series_b" | "series_c" | "public" | "enterprise";
export type ProgramStage = "concept" | "prototype" | "lrip" | "production";
export type ComplexityId = "simple" | "moderate" | "complex" | "high_precision";
export type LotId = "prototype" | "low_rate" | "production";
export type LeadTolerance = "strict" | "moderate" | "flexible";
export type FlexLevel = "low" | "medium" | "high";
export type ExportSensitivity = "low" | "moderate" | "high" | "classified";
export type CmmcLevel = "none" | "level_1" | "level_2" | "level_3";
export type Geography = "domestic_only" | "five_eyes" | "global";
export type FirstUseAction = "first_part" | "first_program" | "pilot_rfq";
export type DataResidency = "us_east" | "us_west" | "us_govcloud";

export interface Contact {
  id: number;
  role: "primary" | "engineering" | "procurement" | "compliance";
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface ProgramType {
  id: string;
  label: string;
  on: boolean;
  stage: ProgramStage;
  annual_volume: string;
  notes: string;
}

export interface CustomerData {
  company: {
    legal_name: string;
    dba: string;
    website: string;
    hq_city: string;
    hq_state: string;
    hq_country: string;
    team_size: string;
    org_type: OrgType;
    funding_stage: FundingStage;
    total_funding_usd: string;
    duns: string;
    cage: string;
    naics: string[];
    year_founded: string;
    contacts: Contact[];
  };
  programs: {
    types: ProgramType[];
    total_programs: string;
    classified_programs: boolean;
    classified_count: string;
  };
  manufacturing: {
    processes: string[];
    part_complexity: ComplexityId;
    complexity_mix: Record<ComplexityId, number>;
    typical_lot: LotId;
    lot_mix: Record<LotId, number>;
    annual_part_count: string;
    annual_spend_usd: string;
    avg_unit_cost_usd: string;
  };
  compliance: {
    itar: boolean;
    cui: boolean;
    as9100: boolean;
    nadcap: boolean;
    defense_program: boolean;
    defense_program_names: string[];
    export_control_sensitivity: ExportSensitivity;
    ear_designation: string;
    flow_down_required: boolean;
    cmmc_required_level: CmmcLevel;
    attestation_required: boolean;
  };
  program_chars: {
    typical_lead_time_weeks: string;
    lead_time_tolerance: LeadTolerance;
    schedule_flexibility: FlexLevel;
    critical_path_sensitivity: FlexLevel;
    cost_vs_speed: number;
    risk_tolerance: FlexLevel;
    preferred_buffer_weeks: string;
  };
  supply_chain: {
    preferred_supplier_types: string[];
    geography: Geography;
    itar_routing_required: boolean;
    regions: string[];
    single_vs_distributed: "single" | "distributed";
    preferred_supplier_count_per_part: string;
    requires_dpas: boolean;
    buy_american_act: boolean;
    berry_amendment: boolean;
  };
  data: {
    cad_systems: string[];
    cad_formats: string[];
    plm_system: string;
    erp_system: string;
    mes_system: string;
    revision_control: string;
    pdm_branching: string;
    file_transfer: string[];
    max_attachment_mb: string;
    drawing_standard: string;
    model_based_definition: boolean;
  };
  first_use: {
    action: FirstUseAction;
    part_name: string;
    part_material: string;
    part_qty: string;
    target_lead_weeks: string;
    pilot_value_usd: string;
    target_suppliers: number;
  };
  workspace: {
    workspace_name: string;
    subdomain: string;
    seats: string;
    sso_required: boolean;
    sso_provider: string;
    data_residency: DataResidency;
    audit_log_retention_yrs: string;
  };
}

export const STAGES: { id: ProgramStage; label: string }[] = [
  { id: "concept", label: "Concept" },
  { id: "prototype", label: "Prototype" },
  { id: "lrip", label: "LRIP" },
  { id: "production", label: "Production" },
];

export const PROCESSES = [
  "CNC machining",
  "Composites",
  "Thermoplastics",
  "Sheet metal",
  "Additive manufacturing",
  "Harnessing",
  "Assembly",
  "Forging",
  "Casting",
];

export const COMPLEXITY: { id: ComplexityId; label: string; desc: string }[] = [
  { id: "simple", label: "Simple", desc: "3-axis, loose tol, basic" },
  { id: "moderate", label: "Moderate", desc: "4-axis, ±0.005, fixturing" },
  { id: "complex", label: "Complex", desc: "5-axis, ±0.001, multi-setup" },
  { id: "high_precision", label: "High precision", desc: "<±0.0005, exotic alloys" },
];

export const LOTS: { id: LotId; label: string; range: string }[] = [
  { id: "prototype", label: "Prototype", range: "1–10" },
  { id: "low_rate", label: "Low rate", range: "10–100" },
  { id: "production", label: "Production", range: "100+" },
];

export const SUPPLIER_TYPES = [
  "Low cost",
  "High precision",
  "Rapid turnaround",
  "Certified suppliers only",
  "Veteran-owned",
  "Small business",
  "HUBZone",
];

export function initialCustomer(): CustomerData {
  return {
    company: {
      legal_name: "Helios Aerodyne, Inc.",
      dba: "Helios",
      website: "heliosaerodyne.com",
      hq_city: "El Segundo",
      hq_state: "CA",
      hq_country: "US",
      team_size: "46",
      org_type: "startup",
      funding_stage: "series_b",
      total_funding_usd: "84",
      duns: "118923441",
      cage: "",
      naics: ["336411", "336413"],
      year_founded: "2022",
      contacts: [
        { id: 1, role: "primary", name: "Jordan Vargas", title: "VP of Manufacturing", email: "jordan@heliosaerodyne.com", phone: "+1 (310) 555-0140" },
        { id: 2, role: "engineering", name: "Sana Ramirez", title: "Director of ME", email: "sana@heliosaerodyne.com", phone: "+1 (310) 555-0188" },
        { id: 3, role: "procurement", name: "Theo Park", title: "Sr. Sourcing Manager", email: "theo@heliosaerodyne.com", phone: "+1 (310) 555-0224" },
      ],
    },
    programs: {
      types: [
        { id: "uas", label: "UAS / drones", on: true, stage: "production", annual_volume: "800", notes: "Class 2 ISR airframes, 35–60 lb MTOW" },
        { id: "evtol", label: "eVTOL", on: false, stage: "concept", annual_volume: "", notes: "" },
        { id: "satellite", label: "Satellites", on: true, stage: "prototype", annual_volume: "6", notes: "180U dispenser bus, internal program" },
        { id: "launch", label: "Launch vehicles", on: false, stage: "concept", annual_volume: "", notes: "" },
        { id: "defense", label: "Defense systems", on: true, stage: "lrip", annual_volume: "120", notes: "Loitering munition under JCO awarded contract" },
        { id: "aircraft", label: "Aircraft components", on: false, stage: "concept", annual_volume: "", notes: "" },
        { id: "ground", label: "Ground systems", on: true, stage: "production", annual_volume: "45", notes: "Launch carriages and GCS housings" },
      ],
      total_programs: "4",
      classified_programs: true,
      classified_count: "1",
    },
    manufacturing: {
      processes: ["CNC machining", "Composites", "Sheet metal", "Additive manufacturing", "Harnessing", "Assembly"],
      part_complexity: "complex",
      complexity_mix: { simple: 10, moderate: 30, complex: 45, high_precision: 15 },
      typical_lot: "low_rate",
      lot_mix: { prototype: 25, low_rate: 55, production: 20 },
      annual_part_count: "~14,500 parts",
      annual_spend_usd: "8.4",
      avg_unit_cost_usd: "580",
    },
    compliance: {
      itar: true,
      cui: true,
      as9100: true,
      nadcap: true,
      defense_program: true,
      defense_program_names: ["DoD JCO LASSO", "USAF AFWERX SBIR Phase III"],
      export_control_sensitivity: "high",
      ear_designation: "EAR99 / 9A610",
      flow_down_required: true,
      cmmc_required_level: "level_2",
      attestation_required: true,
    },
    program_chars: {
      typical_lead_time_weeks: "10",
      lead_time_tolerance: "moderate",
      schedule_flexibility: "low",
      critical_path_sensitivity: "high",
      cost_vs_speed: 65,
      risk_tolerance: "low",
      preferred_buffer_weeks: "2",
    },
    supply_chain: {
      preferred_supplier_types: ["High precision", "Certified suppliers only", "Rapid turnaround"],
      geography: "domestic_only",
      itar_routing_required: true,
      regions: ["West", "Mountain", "Texas"],
      single_vs_distributed: "distributed",
      preferred_supplier_count_per_part: "2",
      requires_dpas: true,
      buy_american_act: true,
      berry_amendment: false,
    },
    data: {
      cad_systems: ["SolidWorks 2024", "NX 2306"],
      cad_formats: ["STEP AP242", "Parasolid", "JT", "3D PDF"],
      plm_system: "Siemens Teamcenter",
      erp_system: "NetSuite",
      mes_system: "—",
      revision_control: "PLM-managed (Teamcenter)",
      pdm_branching: "release-based",
      file_transfer: ["Launchbelt secure room", "SFTP"],
      max_attachment_mb: "500",
      drawing_standard: "ASME Y14.5-2018",
      model_based_definition: true,
    },
    first_use: {
      action: "first_program",
      part_name: "LASSO-A2 Forward Bulkhead",
      part_material: "Aluminum 7075-T651",
      part_qty: "120",
      target_lead_weeks: "12",
      pilot_value_usd: "180000",
      target_suppliers: 4,
    },
    workspace: {
      workspace_name: "Helios Aerodyne",
      subdomain: "helios",
      seats: "12",
      sso_required: true,
      sso_provider: "Okta",
      data_residency: "us_east",
      audit_log_retention_yrs: "7",
    },
  };
}

export function deriveTier(d: CustomerData): string {
  const { itar, cui, defense_program } = d.compliance;
  const orgType = d.company.org_type;
  if (defense_program && itar && cui) return "DEFENSE PRIME";
  if (itar) return "ITAR-CONTROLLED";
  if (orgType === "startup") return "GROWTH-STAGE";
  return "ENTERPRISE";
}
