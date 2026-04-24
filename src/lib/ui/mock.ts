export const PREVIEW_PIPELINE_ROWS = [
  {
    part: "AV-001 Avionics Enclosure",
    program: "ISR Drone Platform - A1",
    module: "Avionics",
    supplier: "Delta Aero Systems",
    partStatus: "in_production",
    routing: "quote_requested",
    quote: "submitted",
  },
  {
    part: "TC-005 Igniter Housing",
    program: "Mjolnir Propulsion System",
    module: "Combustion Chamber",
    supplier: "—",
    partStatus: "in_production",
    routing: "pending",
    quote: "submitted",
  },
  {
    part: "Cargo Mount Plate",
    program: "SkyLift Cargo Drone",
    module: "Cargo Module",
    supplier: "—",
    partStatus: "submitted",
    routing: "pending",
    quote: "draft",
  },
  {
    part: "Motor Housing",
    program: "Nova Logistics Drone",
    module: "Propulsion",
    supplier: "—",
    partStatus: "submitted",
    routing: "pending",
    quote: "draft",
  },
  {
    part: "PR-002 Prop Shaft",
    program: "ISR Drone Platform - A1",
    module: "Propulsion",
    supplier: "Precision CNC Texas",
    partStatus: "in_production",
    routing: "quote_requested",
    quote: "under_review",
  },
] as const;

export const PREVIEW_ATTENTION_ROWS = [
  {
    part: "AV-001 Avionics Enclosure",
    program: "ISR Drone Platform - A1",
    readiness: 85,
    level: "Production Ready",
    quote: "submitted",
    routing: "pending",
    issue: "Awaiting supplier acceptance",
  },
  {
    part: "Cargo Mount Plate",
    program: "SkyLift Cargo Drone",
    readiness: 85,
    level: "Production Ready",
    quote: "draft",
    routing: "pending",
    issue: "Candidate suppliers not selected",
  },
  {
    part: "AF-002 Fuselage Frame",
    program: "ISR Drone Platform - A1",
    readiness: 85,
    level: "Production Ready",
    quote: "draft",
    routing: "pending",
    issue: "Missing tolerance notes",
  },
  {
    part: "TC-004 Exhaust Cone",
    program: "Mjolnir Propulsion System",
    readiness: 85,
    level: "Production Ready",
    quote: "submitted",
    routing: "quote_requested",
    issue: "Routed — awaiting quote",
  },
] as const;

export const PREVIEW_COMPANIES = [
  {
    name: "Aegis Dynamics",
    type: "buyer",
    programs: 2,
    rfqs: 5,
    itar: true,
  },
  {
    name: "Starfleet Command",
    type: "buyer",
    programs: 4,
    rfqs: 11,
    itar: true,
  },
  {
    name: "Nimbus Aerospace",
    type: "buyer",
    programs: 3,
    rfqs: 6,
    itar: false,
  },
  {
    name: "Loki's Forge",
    type: "supplier",
    programs: 0,
    rfqs: 8,
    itar: true,
  },
  {
    name: "Delta Aero Systems",
    type: "supplier",
    programs: 0,
    rfqs: 4,
    itar: false,
  },
  {
    name: "Precision CNC Texas",
    type: "supplier",
    programs: 0,
    rfqs: 6,
    itar: true,
  },
  {
    name: "Teller Prime Industrial",
    type: "supplier",
    programs: 0,
    rfqs: 3,
    itar: false,
  },
  {
    name: "Vector Aerospace Systems",
    type: "supplier",
    programs: 0,
    rfqs: 2,
    itar: false,
  },
] as const;

export const PREVIEW_EQUIPMENT = [
  {
    machine_type: "5-Axis CNC Mill",
    materials: "Aluminum, Titanium, Stainless",
    capacity: "2 machines · 80 hrs/wk",
  },
  {
    machine_type: "CNC Machining Center",
    materials: "Aluminum, Steel",
    capacity: "3 machines · 120 hrs/wk",
  },
  {
    machine_type: "Sheet Metal Brake",
    materials: "Aluminum, Steel",
    capacity: "1 machine · 40 hrs/wk",
  },
] as const;

export const PREVIEW_PROGRAMS_BUYER = [
  {
    name: "Mjolnir Propulsion System",
    mission: "Propulsion",
    stage: "Production",
    description: "High energy propulsion system for hypersonic applications.",
  },
] as const;

export const PREVIEW_SUPPLIER_WORK_PACKAGES = [
  {
    id: "wp-prev-1",
    title: "PR-001 Motor Mount Bracket",
    priority: "high",
    parts: 3,
    need_by: "2026-06-15",
    description:
      "CNC machined aluminum mounts for the A1 airframe. Composite layup tolerance applies on mating surfaces.",
  },
  {
    id: "wp-prev-2",
    title: "TC-001 Turbine Blade set",
    priority: "urgent",
    parts: 4,
    need_by: "2026-05-30",
    description:
      "5-axis machined superalloy blades; requires AS9100 traceability and inspection records.",
  },
  {
    id: "wp-prev-3",
    title: "TC-004 Exhaust Cone",
    priority: "normal",
    parts: 2,
    need_by: "2026-07-01",
    description: "Sheet metal form; post-process heat treatment required.",
  },
] as const;

export const PREVIEW_SUPPLIER_JOBS = [
  {
    id: "job-prev-1",
    job_number: "JOB-0087",
    status: "in_production" as const,
    due_date: "2026-06-15",
    flagged: false,
  },
  {
    id: "job-prev-2",
    job_number: "JOB-0091",
    status: "scheduled" as const,
    due_date: "2026-07-02",
    flagged: false,
  },
  {
    id: "job-prev-3",
    job_number: "JOB-0092",
    status: "inspection" as const,
    due_date: "2026-05-20",
    flagged: true,
  },
] as const;

export const PREVIEW_BUYER_PROGRAMS = [
  {
    id: "prog-prev-1",
    program_name: "Mjolnir Propulsion System",
    program_type: "Propulsion · Production",
    description: "High energy propulsion system for hypersonic applications.",
    status: "active",
    itar_controlled: true,
    cui_controlled: false,
    compliance_level: "AS9100",
  },
  {
    id: "prog-prev-2",
    program_name: "ISR Drone Platform — A1",
    program_type: "ISR · LRIP",
    description: "ISR airframe platform moving into low-rate initial production.",
    status: "active",
    itar_controlled: true,
    cui_controlled: true,
    compliance_level: "AS9100",
  },
] as const;

export const PREVIEW_BUYER_RFQS = [
  {
    id: "rfq-prev-1",
    rfq_title: "Combustion chamber — short run",
    status: "routing_in_progress",
    priority: "high",
    quantity: 12,
    required_delivery_date: "2026-06-10",
  },
  {
    id: "rfq-prev-2",
    rfq_title: "Avionics enclosure, A1 airframe",
    status: "quotes_requested",
    priority: "normal",
    quantity: 40,
    required_delivery_date: "2026-07-15",
  },
  {
    id: "rfq-prev-3",
    rfq_title: "Thermal bracket lot",
    status: "submitted",
    priority: "low",
    quantity: 120,
    required_delivery_date: "2026-08-01",
  },
] as const;

export const PREVIEW_PRODUCTION_UPDATES = [
  {
    part: "TC-001 Turbine Blade",
    supplier: "Loki's Forge",
    status: "in_production",
    progress: 75,
    note: "Third operation complete.",
    at: "2026-04-08T13:31:00Z",
  },
  {
    part: "TC-001 Turbine Blade",
    supplier: "Loki's Forge",
    status: "in_production",
    progress: 70,
    note: "Second operation complete.",
    at: "2026-04-08T13:19:00Z",
  },
  {
    part: "TC-001 Turbine Blade",
    supplier: "Loki's Forge",
    status: "in_production",
    progress: 50,
    note: "First operation complete on 2 of 4 units.",
    at: "2026-04-08T13:09:00Z",
  },
] as const;
