-- 0012_customer_applications.sql  (PROPOSAL — not yet applied)
-- Purpose: snapshot tables for the customer onboarding wizard, plus the new
-- operational customer_profiles + workspace artifacts.
--
-- Creates:
--   * customer_applications + 5 child tables
--   * customer_profiles (NEW operational table, sibling to supplier_profiles)
--   * customer_routing_weights, customer_supplier_filters

-- ============================================================================
-- Parent: customer_applications
-- ============================================================================

create table customer_applications (
  id uuid primary key default gen_random_uuid(),

  -- Ownership: nullable until claimed (anonymous intake supported via token)
  organization_id uuid references organizations(id) on delete set null,
  submitted_by    uuid references users(id) on delete set null,
  intake_token    text unique,
  intake_email    text,

  status   customer_application_status not null default 'draft',
  version  integer not null default 1,
  prior_application_id uuid references customer_applications(id) on delete set null,

  -- Headline / denormalized
  legal_name      text not null,
  dba             text,
  website         text,
  hq_country      text not null default 'US',
  hq_state        text,
  hq_city         text,
  team_size       integer,
  org_type        customer_org_type,
  funding_stage   customer_funding_stage,

  -- Compliance flags (hot path for admin filters + routing rules)
  itar            boolean not null default false,
  cui             boolean not null default false,
  as9100          boolean not null default false,
  nadcap          boolean not null default false,
  defense_program boolean not null default false,
  cmmc_level      cmmc_status not null default 'none',

  -- Routing-relevant headline
  geography                customer_geography not null default 'domestic_only',
  cost_vs_speed            smallint not null default 50 check (cost_vs_speed between 0 and 100),
  risk_tolerance           text,
  suppliers_per_part       smallint not null default 2,
  typical_lead_time_weeks  smallint,
  lead_time_tolerance      customer_lead_tolerance,

  -- First-use intent
  first_use_action customer_first_use_action,

  -- Auto-derived tier (computed on submit, persisted for fast filtering)
  derived_tier customer_tier,

  -- Workspace intent (provisioning details)
  workspace_name      text,
  workspace_subdomain text,
  data_residency      text,
  sso_provider        text,
  initial_seats       integer,

  -- Raw payload
  payload                  jsonb not null,
  payload_schema_version   integer not null default 1,

  -- Lifecycle
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  reviewed_by    uuid references users(id),
  decision_notes text,

  -- Conversion linkage. FK target column added in 0015 alongside customer_profiles FK.
  converted_profile_id uuid,
  converted_at         timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_applications_status_idx on customer_applications(status);
create index customer_applications_org_idx    on customer_applications(organization_id);
create index customer_applications_token_idx  on customer_applications(intake_token);
create index customer_applications_email_idx  on customer_applications(intake_email);
create index customer_applications_tier_idx   on customer_applications(derived_tier);
create index customer_applications_payload_gin
  on customer_applications using gin (payload jsonb_path_ops);

alter table customer_applications enable row level security;

create policy customer_applications_admin_all on customer_applications
  for all using (is_asgard_admin()) with check (is_asgard_admin());

create policy customer_applications_org_select on customer_applications
  for select using (organization_id = current_user_org());
create policy customer_applications_org_insert on customer_applications
  for insert with check (organization_id = current_user_org());
create policy customer_applications_org_update on customer_applications
  for update using (organization_id = current_user_org() and status in ('draft','revisions_requested'))
  with check (organization_id = current_user_org());

-- updated_at trigger
create or replace function set_updated_at_customer_application()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger trg_customer_applications_updated_at
  before update on customer_applications
  for each row execute function set_updated_at_customer_application();

-- ============================================================================
-- Child: customer_application_programs
-- One row per active program type (UAS, eVTOL, satellite, defense, …)
-- ============================================================================

create table customer_application_programs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references customer_applications(id) on delete cascade,
  program_category text not null,             -- 'uas' | 'evtol' | 'satellite' | 'launch' | 'defense' | 'aircraft' | 'ground'
  stage            customer_program_stage not null default 'concept',
  annual_volume    integer,
  notes            text,
  created_at timestamptz not null default now()
);

create index customer_app_programs_app_idx on customer_application_programs(application_id);

alter table customer_application_programs enable row level security;
create policy customer_app_programs_admin_all on customer_application_programs
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_app_programs_org_rw on customer_application_programs
  for all using (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: customer_application_processes
-- Required process matrix
-- ============================================================================

create table customer_application_processes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references customer_applications(id) on delete cascade,
  process_type        text not null,                  -- 'CNC machining', 'Composites', ...
  typical_complexity  text,                           -- 'simple' | 'moderate' | 'complex' | 'high_precision'
  typical_lot_size    text,                           -- 'prototype' | 'low_rate' | 'production'
  notes               text,
  created_at timestamptz not null default now(),
  unique (application_id, process_type)
);

alter table customer_application_processes enable row level security;
create policy customer_app_proc_admin_all on customer_application_processes
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_app_proc_org_rw on customer_application_processes
  for all using (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: customer_application_contacts
-- ============================================================================

create table customer_application_contacts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references customer_applications(id) on delete cascade,
  role     text not null,                              -- 'primary' | 'engineering' | 'procurement' | 'compliance'
  name     text not null,
  title    text,
  email    text,
  phone    text,
  created_at timestamptz not null default now()
);

create index customer_app_contacts_app_idx on customer_application_contacts(application_id);

alter table customer_application_contacts enable row level security;
create policy customer_app_contacts_admin_all on customer_application_contacts
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_app_contacts_org_rw on customer_application_contacts
  for all using (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: customer_application_defense_programs
-- Named programs (e.g. "F-35 LRIP", "JCO LASSO") with FAR/DFARS context.
-- ============================================================================

create table customer_application_defense_programs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references customer_applications(id) on delete cascade,
  program_name      text not null,
  prime_contractor  text,
  contract_vehicle  text,           -- e.g. "OTA via AFWERX", "DPAS DO-A2"
  dpas_rating       text,           -- e.g. "DO-A2", "DX-A1"
  far_clauses       text[] not null default '{}',
  notes             text,
  created_at timestamptz not null default now()
);

create index customer_app_defense_app_idx on customer_application_defense_programs(application_id);

alter table customer_application_defense_programs enable row level security;
create policy customer_app_defense_admin_all on customer_application_defense_programs
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_app_defense_org_rw on customer_application_defense_programs
  for all using (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: customer_application_reviews
-- Append-only FDE review trail.
-- ============================================================================

create table customer_application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references customer_applications(id) on delete cascade,
  reviewer_id    uuid not null references users(id) on delete restrict,
  action         text not null,
  notes          text,
  metadata       jsonb,
  created_at     timestamptz not null default now()
);

create index customer_app_review_app_idx on customer_application_reviews(application_id);

alter table customer_application_reviews enable row level security;
create policy customer_app_review_admin_all on customer_application_reviews
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_app_review_org_read on customer_application_reviews
  for select using (
    exists (select 1 from customer_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Operational: customer_profiles
-- NEW sibling to supplier_profiles. Materialized on conversion.
-- ============================================================================

create table customer_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  source_application_id uuid,    -- FK to customer_applications added in 0015

  tier customer_tier,

  workspace_name        text not null,
  workspace_subdomain   text not null unique,
  data_residency        text not null,
  sso_provider          text not null,
  audit_log_retention_yrs integer not null default 7,

  workspace_status text not null default 'pending',  -- pending | provisioning | live | suspended
  provisioned_at   timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index customer_profiles_status_idx on customer_profiles(workspace_status);

alter table customer_profiles enable row level security;
create policy customer_profiles_admin_all on customer_profiles
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_profiles_org_select on customer_profiles
  for select using (organization_id = current_user_org());

-- updated_at trigger (reuse pattern)
create or replace function set_updated_at_customer_profile()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;
create trigger trg_customer_profiles_updated_at
  before update on customer_profiles
  for each row execute function set_updated_at_customer_profile();

-- ============================================================================
-- Operational: customer_routing_weights
-- Per-customer ranking knobs consulted by the routing engine.
-- ============================================================================

create table customer_routing_weights (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null unique references customer_profiles(id) on delete cascade,
  cost_weight          smallint not null check (cost_weight between 0 and 100),
  speed_weight         smallint not null check (speed_weight between 0 and 100),
  risk_penalty_weight  smallint not null default 50 check (risk_penalty_weight between 0 and 100),
  geography_weight     smallint not null default 50 check (geography_weight between 0 and 100),
  preferred_regions    text[] not null default '{}',
  preferred_supplier_traits text[] not null default '{}',  -- soft preferences
  updated_at timestamptz not null default now()
);

alter table customer_routing_weights enable row level security;
create policy customer_routing_weights_admin_all on customer_routing_weights
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_routing_weights_org_select on customer_routing_weights
  for select using (
    exists (select 1 from customer_profiles p where p.id = customer_profile_id and p.organization_id = current_user_org())
  );

-- ============================================================================
-- Operational: customer_supplier_filters
-- Hard-gate routing filters (ITAR-only, BAA, DPAS, geography, CMMC minimum).
-- Stored as a single jsonb expression for fast evaluation; child tables would
-- force a join on the routing hot path.
-- ============================================================================

create table customer_supplier_filters (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null unique references customer_profiles(id) on delete cascade,
  -- Compact filter expression. Example shape:
  -- {
  --   "itar_required": true,
  --   "buy_american_act": true,
  --   "berry_amendment": false,
  --   "dpas_required": true,
  --   "geography": "domestic_only",
  --   "cmmc_minimum": "level_2",
  --   "min_certifications": ["AS9100D"]
  -- }
  filter_expression jsonb not null,
  updated_at timestamptz not null default now()
);

alter table customer_supplier_filters enable row level security;
create policy customer_supplier_filters_admin_all on customer_supplier_filters
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy customer_supplier_filters_org_select on customer_supplier_filters
  for select using (
    exists (select 1 from customer_profiles p where p.id = customer_profile_id and p.organization_id = current_user_org())
  );
