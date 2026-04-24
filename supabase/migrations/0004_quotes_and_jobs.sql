-- 0004_quotes_and_jobs.sql
-- Supplier quote workflow (task 04).
-- Follows /docs/02_DATA_MODEL.md, /docs/03_USER_GROUPS.md,
-- /docs/04_WORKFLOWS.md §6, §7, §12, and field list in
-- /tasks/04_supplier_quote_submission.md.

-- ============================================================================
-- Enums
-- ============================================================================

-- Task chain: draft → submitted → under_review → accepted
-- plus admin reject path and supplier decline path.
create type quote_status as enum (
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'declined'
);

-- Task 04 slice. Task 05 extends via ALTER TYPE ADD VALUE.
create type job_status as enum ('awarded');

-- ============================================================================
-- quotes
-- ============================================================================

create table quotes (
  id uuid primary key default gen_random_uuid(),
  work_package_id uuid not null references work_packages(id) on delete cascade,
  supplier_organization_id uuid not null references organizations(id) on delete restrict,

  quoted_price numeric(15, 2),
  lead_time_days integer,
  minimum_order_quantity integer,
  quote_notes text,

  status quote_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references users(id),
  review_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id),

  unique (work_package_id, supplier_organization_id)
);

create index quotes_supplier_idx on quotes(supplier_organization_id);
create index quotes_status_idx on quotes(status);
create index quotes_wp_idx on quotes(work_package_id);

-- ============================================================================
-- jobs
-- ============================================================================

create table jobs (
  id uuid primary key default gen_random_uuid(),
  work_package_id uuid not null references work_packages(id) on delete restrict,
  supplier_organization_id uuid not null references organizations(id) on delete restrict,
  quote_id uuid references quotes(id) on delete set null,

  status job_status not null default 'awarded',
  due_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index jobs_supplier_idx on jobs(supplier_organization_id);
create index jobs_wp_idx on jobs(work_package_id);
create index jobs_status_idx on jobs(status);

-- ============================================================================
-- Helper: buyer org of the rfq behind a quote/job, used for buyer visibility.
-- ============================================================================

create or replace function quote_buyer_org(q_id uuid) returns uuid
  language sql stable security definer set search_path = public
as $$
  select p.buyer_organization_id
  from quotes q
  join work_packages wp on wp.id = q.work_package_id
  join rfqs r on r.id = wp.rfq_id
  join programs p on p.id = r.program_id
  where q.id = q_id
$$;

create or replace function job_buyer_org(j_id uuid) returns uuid
  language sql stable security definer set search_path = public
as $$
  select p.buyer_organization_id
  from jobs j
  join work_packages wp on wp.id = j.work_package_id
  join rfqs r on r.id = wp.rfq_id
  join programs p on p.id = r.program_id
  where j.id = j_id
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table quotes enable row level security;
alter table jobs enable row level security;

-- quotes
-- Asgard admin: full access.
-- Supplier: read/write own org's rows only. Never sees competitor quotes.
-- Buyer: read quotes for work packages on their own RFQs (status tracking);
--   they never write.
create policy quotes_select on quotes for select
  using (
    is_asgard_admin()
    or (
      current_user_role() in ('supplier_admin', 'supplier_user')
      and supplier_organization_id = current_user_org()
    )
    or (
      current_user_role() in ('buyer_admin', 'buyer_user')
      and quote_buyer_org(id) = current_user_org()
    )
  );

create policy quotes_insert on quotes for insert
  with check (
    current_user_role() in ('supplier_admin', 'supplier_user')
    and supplier_organization_id = current_user_org()
  );

create policy quotes_update_supplier on quotes for update
  using (
    current_user_role() in ('supplier_admin', 'supplier_user')
    and supplier_organization_id = current_user_org()
    and status in ('draft')
  )
  with check (
    supplier_organization_id = current_user_org()
  );

create policy quotes_update_admin on quotes for update
  using (is_asgard_admin())
  with check (is_asgard_admin());

-- jobs
-- Asgard admin: full access.
-- Supplier: read own org's jobs.
-- Buyer: read jobs on their own RFQs (status tracking).
create policy jobs_select on jobs for select
  using (
    is_asgard_admin()
    or (
      current_user_role() in ('supplier_admin', 'supplier_user')
      and supplier_organization_id = current_user_org()
    )
    or (
      current_user_role() in ('buyer_admin', 'buyer_user')
      and job_buyer_org(id) = current_user_org()
    )
  );

create policy jobs_insert on jobs for insert
  with check (is_asgard_admin());

create policy jobs_update on jobs for update
  using (is_asgard_admin())
  with check (is_asgard_admin());
