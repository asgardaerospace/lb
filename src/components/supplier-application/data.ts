export type StepId =
  | "company"
  | "facility"
  | "compliance"
  | "capabilities"
  | "machines"
  | "workforce"
  | "rates"
  | "materials"
  | "quality"
  | "capacity"
  | "performance"
  | "review";

export interface StepDef {
  id: StepId;
  num: string;
  title: string;
  meta: string;
}

export const STEPS: StepDef[] = [
  { id: "company", num: "01", title: "Company Profile", meta: "Legal entity & contact" },
  { id: "facility", num: "02", title: "Facility Profile", meta: "Plant, security, geography" },
  { id: "compliance", num: "03", title: "Certifications & Compliance", meta: "AS9100, ITAR, CMMC" },
  { id: "capabilities", num: "04", title: "Capabilities", meta: "Processes & part envelope" },
  { id: "machines", num: "05", title: "Machine Inventory", meta: "Equipment & tolerances" },
  { id: "workforce", num: "06", title: "Workforce & Labor", meta: "Headcount, shifts, skills" },
  { id: "rates", num: "07", title: "Rates & Commercial Model", meta: "Hourly, NRE, payment terms" },
  { id: "materials", num: "08", title: "Materials & Specialties", meta: "Approved alloys, treatments" },
  { id: "quality", num: "09", title: "Quality System", meta: "Inspection, traceability" },
  { id: "capacity", num: "10", title: "Capacity & Availability", meta: "Lead time, utilization" },
  { id: "performance", num: "11", title: "Past Performance", meta: "References, OTD, programs" },
  { id: "review", num: "12", title: "Review & Submit", meta: "Sign, attest, dispatch" },
];

export interface FacilityRow {
  id: number;
  name: string;
  type: string;
  address: string;
  sqft: number;
  owned: boolean;
  secure: boolean;
}

export interface CertRow {
  id: number;
  name: string;
  issuer: string;
  number: string;
  expires: string;
  file: string;
}

export interface MachineRow {
  id: number;
  type: string;
  make: string;
  model: string;
  count: number;
  envelope: string;
  spindle_rpm: number;
  controller: string;
  year: number;
  condition: string;
}

export interface ProgramRow {
  id: number;
  customer: string;
  program: string;
  years: string;
  spend: string;
  reference: boolean;
}

export interface ReferenceRow {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

export interface ApplicationData {
  company: {
    legal_name: string;
    dba: string;
    entity_type: string;
    ein: string;
    duns: string;
    cage: string;
    naics: string[];
    year_founded: string;
    website: string;
    hq_address: string;
    hq_city: string;
    hq_state: string;
    hq_zip: string;
    hq_country: string;
    ownership_type: string;
    small_business: boolean;
    veteran_owned: boolean;
    woman_owned: boolean;
    hubzone: boolean;
    contact_name: string;
    contact_title: string;
    contact_email: string;
    contact_phone: string;
  };
  facility: {
    facilities: FacilityRow[];
    climate_controlled: boolean;
    controlled_access: boolean;
    itar_segregated: boolean;
    foreign_visitors: string;
    cybersecurity_posture: string;
    power_redundancy: string;
    crane_capacity_lbs: string;
    max_part_envelope: string;
  };
  compliance: {
    as9100d: boolean;
    iso9001: boolean;
    itar_registered: boolean;
    ear_classified: boolean;
    cmmc_status: string;
    nist_800_171_score: string;
    nadcap_processes: string[];
    faa_pma: boolean;
    far_part_145: boolean;
    counterfeit_program: boolean;
    foreign_object_program: boolean;
    conflict_minerals: boolean;
    cybersecurity_incidents: string;
    certs: CertRow[];
  };
  capabilities: {
    processes: string[];
    secondary: string[];
    part_envelope_x: string;
    part_envelope_y: string;
    part_envelope_z: string;
    tightest_tolerance: string;
    surface_finish_ra: string;
    drawing_standards: string[];
    cad_systems: string[];
    file_formats: string[];
    assembly: boolean;
    kitting: boolean;
    first_article: boolean;
    typical_lot_min: string;
    typical_lot_max: string;
  };
  machines: { list: MachineRow[] };
  workforce: {
    total_employees: string;
    machinists: string;
    programmers: string;
    qa_inspectors: string;
    engineers: string;
    management: string;
    admin: string;
    shifts_per_day: number;
    hours_per_shift: number;
    days_per_week: number;
    us_persons_pct: number;
    union: boolean;
    apprentice_program: boolean;
    avg_tenure_years: string;
    cleared_personnel: string;
    clearance_levels: string[];
  };
  rates: {
    shop_rate_3axis: string;
    shop_rate_5axis: string;
    shop_rate_turn: string;
    shop_rate_edm: string;
    programming_rate: string;
    inspection_rate: string;
    assembly_rate: string;
    nre_min: string;
    tooling_markup_pct: string;
    material_markup_pct: string;
    payment_terms: string;
    currency: string;
    pricing_model: string;
    volume_discount_threshold: string;
    volume_discount_pct: string;
    expedite_premium_pct: string;
  };
  materials: {
    alloys: string[];
    plastics: string[];
    composites: boolean;
    restricted_substances: string[];
    treatments: string[];
    welding: string[];
    brazing: boolean;
    raw_material_traceability: string;
    counterfeit_screening: boolean;
  };
  quality: {
    inspection_method: string[];
    ppap_capable: boolean;
    first_article_aS9102: boolean;
    sample_inspection: string;
    gauge_rr_program: boolean;
    calibration_iso17025: boolean;
    mes_system: string;
    erp_system: string;
    digital_traveler: boolean;
    net_inspection_capacity_per_week: string;
    rejection_rate_ppm: string;
    dpu_target: string;
    escape_rate_12mo: string;
  };
  capacity: {
    current_utilization_pct: number;
    open_capacity_hrs_per_week: string;
    typical_lead_time_simple: string;
    typical_lead_time_complex: string;
    expedite_capable: boolean;
    expedite_min_lead: string;
    backlog_dollars: string;
    backlog_weeks: string;
    growth_capacity_pct: string;
  };
  performance: {
    otd_12mo: string;
    quality_yield_12mo: string;
    escapes_12mo: string;
    programs: ProgramRow[];
    references: ReferenceRow[];
    disputes_5yr: string;
    terminations_5yr: string;
  };
  attest: {
    sig_name: string;
    sig_title: string;
    sig_date: string;
    truthful: boolean;
    authorized: boolean;
    no_debarment: boolean;
    cybersecurity: boolean;
  };
}

export function initialApp(): ApplicationData {
  return {
    company: {
      legal_name: "Meridian Precision Machining, LLC",
      dba: "Meridian Precision",
      entity_type: "llc",
      ein: "47-2918340",
      duns: "117548912",
      cage: "8K2J4",
      naics: ["332710", "336413"],
      year_founded: "2008",
      website: "meridian-precision.com",
      hq_address: "4827 Centennial Blvd",
      hq_city: "Colorado Springs",
      hq_state: "CO",
      hq_zip: "80919",
      hq_country: "US",
      ownership_type: "private",
      small_business: true,
      veteran_owned: false,
      woman_owned: false,
      hubzone: false,
      contact_name: "Dana Whitfield",
      contact_title: "Director of Business Development",
      contact_email: "dana.w@meridian-precision.com",
      contact_phone: "+1 (719) 555-0182",
    },
    facility: {
      facilities: [
        {
          id: 1,
          name: "Colorado Springs HQ + Production",
          type: "production",
          address: "4827 Centennial Blvd, Colorado Springs, CO 80919",
          sqft: 48000,
          owned: true,
          secure: true,
        },
        {
          id: 2,
          name: "Pueblo Heat Treat & Finishing",
          type: "finishing",
          address: "311 Industrial Park Rd, Pueblo, CO 81001",
          sqft: 12500,
          owned: false,
          secure: false,
        },
      ],
      climate_controlled: true,
      controlled_access: true,
      itar_segregated: true,
      foreign_visitors: "documented",
      cybersecurity_posture: "nist_800_171",
      power_redundancy: "ups_generator",
      crane_capacity_lbs: "20000",
      max_part_envelope: "60 × 36 × 24 in",
    },
    compliance: {
      as9100d: true,
      iso9001: true,
      itar_registered: true,
      ear_classified: true,
      cmmc_status: "level_2",
      nist_800_171_score: "112",
      nadcap_processes: ["Heat Treating", "Chemical Processing"],
      faa_pma: false,
      far_part_145: false,
      counterfeit_program: true,
      foreign_object_program: true,
      conflict_minerals: true,
      cybersecurity_incidents: "none",
      certs: [
        { id: 1, name: "AS9100D", issuer: "DEKRA Certification", number: "AS-2024-118273", expires: "2027-03-14", file: "AS9100D-Cert-2024.pdf" },
        { id: 2, name: "ISO 9001:2015", issuer: "DEKRA Certification", number: "ISO-2024-118273", expires: "2027-03-14", file: "ISO9001-Cert-2024.pdf" },
        { id: 3, name: "NADCAP — Heat Treating", issuer: "PRI", number: "AC7102/8 R-3492", expires: "2026-09-22", file: "NADCAP-HT-2024.pdf" },
        { id: 4, name: "ITAR Registration", issuer: "DDTC", number: "M-31472", expires: "2026-08-01", file: "ITAR-Reg-2024.pdf" },
      ],
    },
    capabilities: {
      processes: [
        "3-Axis CNC Milling",
        "4-Axis CNC Milling",
        "5-Axis CNC Milling",
        "CNC Turning",
        "Mill-Turn",
        "Wire EDM",
        "Surface Grinding",
      ],
      secondary: [
        "Anodizing (Type II/III)",
        "Black Oxide",
        "Heat Treating (in-house)",
        "Passivation",
        "Laser Marking",
      ],
      part_envelope_x: "60",
      part_envelope_y: "36",
      part_envelope_z: "24",
      tightest_tolerance: "0.0002",
      surface_finish_ra: "8",
      drawing_standards: ["ASME Y14.5-2018", "MIL-STD-100"],
      cad_systems: ["SolidWorks", "CATIA V5", "NX"],
      file_formats: ["STEP", "IGES", "Parasolid", "DWG", "DXF", "3D PDF"],
      assembly: true,
      kitting: true,
      first_article: true,
      typical_lot_min: "5",
      typical_lot_max: "2500",
    },
    machines: {
      list: [
        { id: 1, type: "5-Axis Mill", make: "DMG MORI", model: "DMU 65 monoBLOCK", count: 3, envelope: "650 × 650 × 560 mm", spindle_rpm: 14000, controller: "Heidenhain TNC 640", year: 2021, condition: "excellent" },
        { id: 2, type: "5-Axis Mill", make: "Mazak", model: "VARIAXIS i-700", count: 2, envelope: "700 × 700 × 500 mm", spindle_rpm: 12000, controller: "Mazatrol SmoothX", year: 2019, condition: "excellent" },
        { id: 3, type: "3-Axis Mill", make: "Haas", model: "VF-4SS", count: 6, envelope: "50 × 20 × 25 in", spindle_rpm: 12000, controller: "Haas NGC", year: 2020, condition: "good" },
        { id: 4, type: "Mill-Turn", make: "Mazak", model: "INTEGREX i-200", count: 2, envelope: "Ø 658 × 1011 mm", spindle_rpm: 5000, controller: "Mazatrol SmoothX", year: 2022, condition: "excellent" },
        { id: 5, type: "CNC Lathe", make: "DMG MORI", model: "NLX 2500SY", count: 3, envelope: "Ø 460 × 1240 mm", spindle_rpm: 5000, controller: "Mitsubishi M730", year: 2018, condition: "good" },
        { id: 6, type: "Wire EDM", make: "Sodick", model: "AQ400L", count: 1, envelope: "400 × 300 × 250 mm", spindle_rpm: 0, controller: "Sodick LN2W", year: 2020, condition: "excellent" },
        { id: 7, type: "Surface Grinder", make: "Okamoto", model: "ACC-124EX", count: 2, envelope: "600 × 300 mm", spindle_rpm: 1800, controller: "PLC", year: 2017, condition: "good" },
        { id: 8, type: "CMM", make: "Zeiss", model: "CONTURA G2 RDS", count: 2, envelope: "1000 × 1500 × 600 mm", spindle_rpm: 0, controller: "CALYPSO 2024", year: 2022, condition: "excellent" },
      ],
    },
    workforce: {
      total_employees: "84",
      machinists: "38",
      programmers: "8",
      qa_inspectors: "6",
      engineers: "10",
      management: "12",
      admin: "10",
      shifts_per_day: 2,
      hours_per_shift: 10,
      days_per_week: 5,
      us_persons_pct: 100,
      union: false,
      apprentice_program: true,
      avg_tenure_years: "7.4",
      cleared_personnel: "12",
      clearance_levels: ["Secret", "Confidential"],
    },
    rates: {
      shop_rate_3axis: "95",
      shop_rate_5axis: "145",
      shop_rate_turn: "92",
      shop_rate_edm: "135",
      programming_rate: "120",
      inspection_rate: "115",
      assembly_rate: "78",
      nre_min: "850",
      tooling_markup_pct: "12",
      material_markup_pct: "8",
      payment_terms: "net_30",
      currency: "USD",
      pricing_model: "fixed_quote",
      volume_discount_threshold: "100",
      volume_discount_pct: "6",
      expedite_premium_pct: "25",
    },
    materials: {
      alloys: [
        "Aluminum 6061-T6",
        "Aluminum 7075-T651",
        "Aluminum 2024-T351",
        "Stainless 304",
        "Stainless 316L",
        "Stainless 17-4 PH",
        "Stainless 15-5 PH",
        "Titanium 6Al-4V",
        "Titanium CP Grade 2",
        "Inconel 625",
        "Inconel 718",
        "Hastelloy C-276",
        "4140 Steel",
        "4340 Steel",
        "A286",
        "Copper C110",
        "Brass 360",
      ],
      plastics: ["PEEK", "PEI/Ultem", "Acetal", "Torlon", "G-10/FR4"],
      composites: false,
      restricted_substances: ["Beryllium", "Hexavalent Chromium"],
      treatments: [
        "Anodize Type II",
        "Anodize Type III (hardcoat)",
        "Chemical Conversion (Alodine 1200)",
        "Black Oxide",
        "Passivation (AMS 2700)",
        "Cadmium Plating",
        "Zinc-Nickel Plating",
        "Heat Treat (per AMS specs)",
        "Cryogenic Treatment",
      ],
      welding: ["TIG", "MIG", "Spot"],
      brazing: true,
      raw_material_traceability: "full_dfars",
      counterfeit_screening: true,
    },
    quality: {
      inspection_method: ["CMM", "Faro Arm", "Vision System", "Surface Profilometer", "Optical Comparator"],
      ppap_capable: true,
      first_article_aS9102: true,
      sample_inspection: "100_percent_critical",
      gauge_rr_program: true,
      calibration_iso17025: true,
      mes_system: "Plex",
      erp_system: "Epicor Kinetic",
      digital_traveler: true,
      net_inspection_capacity_per_week: "320",
      rejection_rate_ppm: "1240",
      dpu_target: "0.0008",
      escape_rate_12mo: "0.04",
    },
    capacity: {
      current_utilization_pct: 78,
      open_capacity_hrs_per_week: "180",
      typical_lead_time_simple: "3-4 weeks",
      typical_lead_time_complex: "8-10 weeks",
      expedite_capable: true,
      expedite_min_lead: "5 days",
      backlog_dollars: "2.4M",
      backlog_weeks: "11",
      growth_capacity_pct: "22",
    },
    performance: {
      otd_12mo: "94.2",
      quality_yield_12mo: "99.6",
      escapes_12mo: "2",
      programs: [
        { id: 1, customer: "Lockheed Martin (Skunk Works)", program: "AIM-260 Adapter Brackets", years: "2021–present", spend: "$3.2M", reference: true },
        { id: 2, customer: "Northrop Grumman", program: "Triton UAV — Engine Mounts", years: "2019–present", spend: "$1.8M", reference: true },
        { id: 3, customer: "Anduril Industries", program: "Ghost-X Gimbal Components", years: "2023–present", spend: "$0.9M", reference: false },
        { id: 4, customer: "Blue Origin", program: "BE-4 Turbomachinery Fixtures", years: "2022–2024", spend: "$0.6M", reference: true },
      ],
      references: [
        { name: "Marcus Reilly", title: "Sr. Supply Chain Manager", company: "Lockheed Martin", email: "m.reilly@lmco.example", phone: "+1 (817) 555-0140" },
        { name: "Priya Venkatesan", title: "Principal Buyer", company: "Northrop Grumman", email: "p.venk@ngc.example", phone: "+1 (310) 555-0193" },
      ],
      disputes_5yr: "0",
      terminations_5yr: "0",
    },
    attest: {
      sig_name: "",
      sig_title: "",
      sig_date: "",
      truthful: false,
      authorized: false,
      no_debarment: false,
      cybersecurity: false,
    },
  };
}
