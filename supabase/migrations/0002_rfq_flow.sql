-- 0002_rfq_flow.sql
-- Schema + RLS for the RFQ intake module (task 02).
-- Follows /docs/02_DATA_MODEL.md, /docs/03_USER_GROUPS.md,
-- /docs/04_WORKFLOWS.md §12, and the field list in /tasks/02_create_rfq_flow.md.

-- ============================================================================
-- Enums
-- ============================================================================

-- Program lifecycle: programs remain active until a buyer archives them.
create type program_status as enum ('active', 'archived');

-- RFQ lifecycle (task 02 slice of /docs/04_WORKFLOWS.md §12).
-- Later tasks (routing, quoting, award) extend this enum with alter type add value.
create type rfq_status as enum ('draft', 'submitted');

-- Priority is enumerated to keep data clean; values are not authoritative in the docs.
create type rfq_priority as enum ('low', 'normal', 'high', 'urgent');

-- ============================================================================
-- programs
-- ============================================================================

create table programs (
  id uuid primary key default gen_random_uuid(),
  buyer_organization_id uuid not null references organizations(id) on delete restrict,

  program_name text not null,
  program_type text,
  description text,

  compliance_level text,
  itar_controlled boolean not null default false,
  cui_controlled boolean not null default false,

  status program_status not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index programs_org_idx on programs(buyer_organization_id);
create index programs_status_idx on programs(status);

-- ============================================================================
-- rfqs
-- ============================================================================

create table rfqs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,

  rfq_title text not null,
  description text,
  quantity integer,
  required_delivery_date date,
  priority rfq_priority not null default 'normal',

  status rfq_status not null default 'draft',
  submitted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index rfqs_program_idx on rfqs(program_id);
create index rfqs_status_idx on rfqs(status);

-- ============================================================================
-- parts
-- ============================================================================

create table parts (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,

  part_number text not null,
  part_name text,
  revision text,
  material text,
  process_required text,
  quantity integer,
  tolerance_notes text,
  finish_requirements text,
  inspection_requirements text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index parts_rfq_idx on parts(rfq_id);

-- ============================================================================
-- Helper: resolve buyer_organization_id from an rfq or program id for RLS.
-- ============================================================================

create or replace function rfq_buyer_org(rfq_id uuid) returns uuid
  language sql stable security definer set search_path = public
as $$
  select p.buyer_organization_id
  from rfqs r
  join programs p on p.id = r.program_id
  where r.id = rfq_id
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table programs enable row level security;
alter table rfqs enable row level security;
alter table parts enable row level security;

-- programs: buyers see own org; asgard admin sees all
create policy programs_select on programs for select
  using (
    is_asgard_admin()
    or buyer_organization_id = current_user_org()
  );

create policy programs_insert on programs for insert
  with check (
    buyer_organization_id = current_user_org()
    and current_user_role() in ('buyer_admin', 'buyer_user')
  );

create policy programs_update on programs for update
  using (
    buyer_organization_id = current_user_org()
    and current_user_role() in ('buyer_admin', 'buyer_user')
  )
  with check (buyer_organization_id = current_user_org());

-- rfqs: follow the parent program's org
create policy rfqs_select on rfqs for select
  using (
    is_asgard_admin()
    or exists (
      select 1 from programs p
      where p.id = rfqs.program_id
        and p.buyer_organization_id = current_user_org()
    )
  );

create policy rfqs_insert on rfqs for insert
  with check (
    current_user_role() in ('buyer_admin', 'buyer_user')
    and exists (
      select 1 from programs p
      where p.id = rfqs.program_id
        and p.buyer_organization_id = current_user_org()
    )
  );

create policy rfqs_update on rfqs for update
  using (
    current_user_role() in ('buyer_admin', 'buyer_user')
    and exists (
      select 1 from programs p
      where p.id = rfqs.program_id
        and p.buyer_organization_id = current_user_org()
    )
  )
  with check (true);

-- parts: follow the parent rfq's org
create policy parts_select on parts for select
  using (
    is_asgard_admin()
    or rfq_buyer_org(parts.rfq_id) = current_user_org()
  );

create policy parts_insert on parts for insert
  with check (
    current_user_role() in ('buyer_admin', 'buyer_user')
    and rfq_buyer_org(parts.rfq_id) = current_user_org()
  );

create policy parts_update on parts for update
  using (
    current_user_role() in ('buyer_admin', 'buyer_user')
    and rfq_buyer_org(parts.rfq_id) = current_user_org()
  )
  with check (true);

create policy parts_delete on parts for delete
  using (
    current_user_role() in ('buyer_admin', 'buyer_user')
    and rfq_buyer_org(parts.rfq_id) = current_user_org()
  );
