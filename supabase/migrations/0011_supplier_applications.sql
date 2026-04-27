-- 0011_supplier_applications.sql  (PROPOSAL — not yet applied)
-- Purpose: snapshot tables for the supplier intake wizard.
-- Operational supplier_profiles is left untouched; conversion happens in 0015.
--
-- Conventions follow supabase/migrations/0001_supplier_profiles.sql:
--   * UUID PKs via gen_random_uuid()
--   * snake_case columns, *_id FK names
--   * created_at/updated_at timestamptz default now()
--   * RLS enabled per table; helper functions reused from 0001

-- ============================================================================
-- Parent: supplier_applications
-- One row per submission attempt. Versioned via prior_application_id chain.
-- ============================================================================

create table supplier_applications (
  id uuid primary key default gen_random_uuid(),

  -- Ownership: nullable until claimed (anonymous intake supported via token)
  organization_id uuid references organizations(id) on delete set null,
  submitted_by    uuid references users(id) on delete set null,

  -- Anonymous intake control. Token is the only credential a non-logged-in
  -- submitter has to read/update their own draft.
  intake_token    text unique,
  intake_email    text,

  status   supplier_application_status not null default 'draft',
  version  integer not null default 1,
  prior_application_id uuid references supplier_applications(id) on delete set null,

  -- Headline / denormalized fields (used in admin lists, scoring, search)
  legal_name        text not null,
  dba               text,
  hq_country        text not null default 'US',
  hq_state          text,
  hq_city           text,
  team_size         integer,
  year_founded      integer,
  duns              text,
  cage              text,
  itar_registered   boolean not null default false,
  cmmc_level        cmmc_status not null default 'none',
  primary_processes text[] not null default '{}',

  -- Raw payload (full wizard state). Schema-versioned so readers can branch.
  payload                  jsonb not null,
  payload_schema_version   integer not null default 1,

  -- Lifecycle
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  reviewed_by    uuid references users(id),
  decision_notes text,

  -- Conversion linkage. The FK target column is added in 0015.
  -- (Declared here as untyped uuid; 0015 will add the FK constraint.)
  converted_profile_id uuid,
  converted_at         timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supplier_applications_status_idx on supplier_applications(status);
create index supplier_applications_org_idx    on supplier_applications(organization_id);
create index supplier_applications_token_idx  on supplier_applications(intake_token);
create index supplier_applications_email_idx  on supplier_applications(intake_email);
create index supplier_applications_payload_gin
  on supplier_applications using gin (payload jsonb_path_ops);

alter table supplier_applications enable row level security;

-- Admin: full read/write
create policy supplier_applications_admin_all on supplier_applications
  for all using (is_asgard_admin()) with check (is_asgard_admin());

-- Org members: read/write own org's applications
create policy supplier_applications_org_select on supplier_applications
  for select using (organization_id = current_user_org());

create policy supplier_applications_org_insert on supplier_applications
  for insert with check (organization_id = current_user_org());

create policy supplier_applications_org_update on supplier_applications
  for update using (organization_id = current_user_org() and status in ('draft','revisions_requested'))
  with check (organization_id = current_user_org());

-- NOTE: anonymous (intake_token) access is handled via SECURITY DEFINER RPCs,
-- not direct row policies. No anon policy is added here.

-- ============================================================================
-- Child: supplier_application_certifications
-- ============================================================================

create table supplier_application_certifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references supplier_applications(id) on delete cascade,
  cert_type        text not null,        -- e.g. AS9100D, ISO9001, NADCAP/AC7102
  issuer           text,
  issued_date      date,
  expiration_date  date,
  certificate_no   text,
  document_id      uuid,                 -- documents(id), set after upload (FK added in 0014)
  created_at timestamptz not null default now()
);

create index supplier_app_cert_app_idx on supplier_application_certifications(application_id);

alter table supplier_application_certifications enable row level security;
create policy supplier_app_cert_admin_all on supplier_application_certifications
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy supplier_app_cert_org_rw on supplier_application_certifications
  for all using (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: supplier_application_machines
-- ============================================================================

create table supplier_application_machines (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references supplier_applications(id) on delete cascade,
  machine_type        text not null,         -- "5-axis CNC mill", "FFF printer", etc.
  manufacturer        text,
  model               text,
  envelope            text,                  -- bounding box / build volume
  axis_count          smallint,
  tolerance_capability text,                 -- "±0.0005 in"
  materials_supported text[] not null default '{}',
  count               smallint not null default 1,
  created_at timestamptz not null default now()
);

create index supplier_app_machine_app_idx on supplier_application_machines(application_id);

alter table supplier_application_machines enable row level security;
create policy supplier_app_machine_admin_all on supplier_application_machines
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy supplier_app_machine_org_rw on supplier_application_machines
  for all using (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: supplier_application_capabilities
-- (process × material capability matrix)
-- ============================================================================

create table supplier_application_capabilities (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references supplier_applications(id) on delete cascade,
  process_type        text not null,        -- machining, sheet metal, composites, AM, ...
  materials           text[] not null default '{}',
  notes               text,
  created_at timestamptz not null default now()
);

create index supplier_app_cap_app_idx on supplier_application_capabilities(application_id);

alter table supplier_application_capabilities enable row level security;
create policy supplier_app_cap_admin_all on supplier_application_capabilities
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy supplier_app_cap_org_rw on supplier_application_capabilities
  for all using (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: supplier_application_past_performance
-- ============================================================================

create table supplier_application_past_performance (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references supplier_applications(id) on delete cascade,
  customer_name      text not null,
  program_name       text,
  contract_type      text,        -- "DPAS-rated", "commercial", "subcontract"
  year_start         integer,
  year_end           integer,
  contract_value_usd numeric(14,2),
  references_contact text,
  created_at timestamptz not null default now()
);

create index supplier_app_pp_app_idx on supplier_application_past_performance(application_id);

alter table supplier_application_past_performance enable row level security;
create policy supplier_app_pp_admin_all on supplier_application_past_performance
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy supplier_app_pp_org_rw on supplier_application_past_performance
  for all using (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  ) with check (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- Child: supplier_application_reviews
-- Multi-row append-only audit trail of reviewer actions.
-- ============================================================================

create table supplier_application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references supplier_applications(id) on delete cascade,
  reviewer_id    uuid not null references users(id) on delete restrict,
  action         text not null,    -- 'comment' | 'request_info' | 'approve' | 'reject' | 'reopen'
  notes          text,
  metadata       jsonb,             -- e.g. {"requested_fields":["machines","cmmc_level"]}
  created_at     timestamptz not null default now()
);

create index supplier_app_review_app_idx on supplier_application_reviews(application_id);

alter table supplier_application_reviews enable row level security;
create policy supplier_app_review_admin_all on supplier_application_reviews
  for all using (is_asgard_admin()) with check (is_asgard_admin());
-- Org members can READ their own review trail (decision_notes shown to them);
-- they cannot write.
create policy supplier_app_review_org_read on supplier_application_reviews
  for select using (
    exists (select 1 from supplier_applications a where a.id = application_id and a.organization_id = current_user_org())
  );

-- ============================================================================
-- updated_at trigger for supplier_applications
-- ============================================================================
create or replace function set_updated_at_supplier_application()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger trg_supplier_applications_updated_at
  before update on supplier_applications
  for each row execute function set_updated_at_supplier_application();
