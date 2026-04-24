-- 0001_supplier_profiles.sql
-- Schema + RLS for the supplier profile module (task 01).
-- Follows /docs/02_DATA_MODEL.md and /docs/03_USER_GROUPS.md.

-- ============================================================================
-- Enums
-- ============================================================================

create type organization_type as enum ('asgard', 'supplier', 'buyer');

create type user_role as enum (
  'asgard_admin',
  'supplier_admin',
  'supplier_user',
  'buyer_admin',
  'buyer_user'
);

create type user_status as enum ('active', 'invited', 'disabled');

create type supplier_approval_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'revisions_requested'
);

create type cmmc_status as enum ('none', 'level_1', 'level_2', 'level_3');

-- ============================================================================
-- organizations
-- ============================================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type organization_type not null,
  itar_registered boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- users
-- ============================================================================

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete restrict,
  email text not null unique,
  role user_role not null,
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_organization_id_idx on users(organization_id);

-- ============================================================================
-- supplier_profiles
-- ============================================================================

create table supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  approval_status supplier_approval_status not null default 'draft',

  company_summary text,
  facility_size_sqft integer,
  employee_count integer,
  quality_system_notes text,
  capacity_notes text,

  as9100_certified boolean not null default false,
  iso9001_certified boolean not null default false,
  itar_registered boolean not null default false,
  cmmc_status cmmc_status not null default 'none',

  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references users(id),
  review_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index supplier_profiles_status_idx on supplier_profiles(approval_status);

-- ============================================================================
-- certifications / machines / capabilities / documents
-- Declared per /docs/02_DATA_MODEL.md so foreign keys and RLS can be consistent.
-- Task 01 does not populate these; CRUD comes in later tasks.
-- ============================================================================

create table certifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null,
  expiration_date date,
  verification_status text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create table machines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  machine_type text not null,
  materials_supported text[] not null default '{}',
  capacity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create table capabilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  process_type text not null,
  materials_supported text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  file_type text not null,
  storage_path text not null,
  compliance_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

-- ============================================================================
-- audit_logs
-- Fields per /docs/02_DATA_MODEL.md §2 plus entity_id, organization_id, metadata
-- (necessary for useful querying; flagged as an assumption).
-- Append-only: no update/delete privileges granted.
-- ============================================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  organization_id uuid references organizations(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_organization_idx on audit_logs(organization_id);

-- ============================================================================
-- Helper: role + org of the calling user
-- ============================================================================

create or replace function current_user_role() returns user_role
  language sql stable security definer set search_path = public
as $$
  select role from users where id = auth.uid()
$$;

create or replace function current_user_org() returns uuid
  language sql stable security definer set search_path = public
as $$
  select organization_id from users where id = auth.uid()
$$;

create or replace function is_asgard_admin() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(current_user_role() = 'asgard_admin', false)
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table supplier_profiles enable row level security;
alter table certifications enable row level security;
alter table machines enable row level security;
alter table capabilities enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;

-- organizations: admins see all; users see own org
create policy organizations_select on organizations for select
  using (is_asgard_admin() or id = current_user_org());

-- users: admins see all; users see own org
create policy users_select on users for select
  using (is_asgard_admin() or organization_id = current_user_org());

-- supplier_profiles
create policy supplier_profiles_select on supplier_profiles for select
  using (is_asgard_admin() or organization_id = current_user_org());

create policy supplier_profiles_insert on supplier_profiles for insert
  with check (
    organization_id = current_user_org()
    and current_user_role() in ('supplier_admin', 'supplier_user')
  );

create policy supplier_profiles_update_supplier on supplier_profiles for update
  using (
    organization_id = current_user_org()
    and current_user_role() = 'supplier_admin'
    and approval_status in ('draft', 'revisions_requested', 'submitted')
  )
  with check (organization_id = current_user_org());

create policy supplier_profiles_update_admin on supplier_profiles for update
  using (is_asgard_admin())
  with check (is_asgard_admin());

-- org-scoped tables
create policy certs_org_select on certifications for select
  using (is_asgard_admin() or organization_id = current_user_org());
create policy machines_org_select on machines for select
  using (is_asgard_admin() or organization_id = current_user_org());
create policy capabilities_org_select on capabilities for select
  using (is_asgard_admin() or organization_id = current_user_org());
create policy documents_org_select on documents for select
  using (is_asgard_admin() or organization_id = current_user_org());

-- audit_logs: admins see all; users see own org. Writes go through service role only.
create policy audit_logs_select on audit_logs for select
  using (is_asgard_admin() or organization_id = current_user_org());
