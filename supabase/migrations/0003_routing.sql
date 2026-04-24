-- 0003_routing.sql
-- Routing console module (task 03).
-- Follows /docs/02_DATA_MODEL.md, /docs/03_USER_GROUPS.md,
-- /docs/04_WORKFLOWS.md §5 and §12, and field list in /tasks/03_build_routing_console.md.

-- ============================================================================
-- RFQ state extension
-- Task 03 adds two states to the rfq_status enum declared in 0002_rfq_flow.sql.
-- `routing_in_progress` — at least one work package created for the rfq
-- `quotes_requested`    — at least one routing decision moved to quote_requested
-- ALTER TYPE ADD VALUE is run outside any transaction block by the Supabase
-- migration runner, so each value is a separate statement.
-- ============================================================================

alter type rfq_status add value if not exists 'routing_in_progress';
alter type rfq_status add value if not exists 'quotes_requested';

-- ============================================================================
-- Enums
-- ============================================================================

create type work_package_status as enum ('open', 'routed');
create type routing_decision_status as enum ('pending', 'quote_requested');

-- ============================================================================
-- work_packages
-- ============================================================================

create table work_packages (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  package_name text not null,
  package_type text,
  description text,
  status work_package_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index work_packages_rfq_idx on work_packages(rfq_id);
create index work_packages_status_idx on work_packages(status);

-- ============================================================================
-- work_package_parts (junction)
-- A single part from an RFQ can be assigned to at most one work package for
-- now; we still model it as a junction so future workflows can split one part
-- across packages if needed.
-- ============================================================================

create table work_package_parts (
  work_package_id uuid not null references work_packages(id) on delete cascade,
  part_id uuid not null references parts(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references users(id),
  primary key (work_package_id, part_id)
);

create index work_package_parts_part_idx on work_package_parts(part_id);

-- ============================================================================
-- routing_decisions
-- ============================================================================

create table routing_decisions (
  id uuid primary key default gen_random_uuid(),
  work_package_id uuid not null references work_packages(id) on delete cascade,
  supplier_organization_id uuid not null references organizations(id) on delete restrict,

  capability_fit_score integer check (capability_fit_score between 0 and 100),
  capacity_fit_score integer check (capacity_fit_score between 0 and 100),
  compliance_fit_score integer check (compliance_fit_score between 0 and 100),
  schedule_fit_score integer check (schedule_fit_score between 0 and 100),

  routing_rationale text,
  routing_status routing_decision_status not null default 'pending',
  quote_requested_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users(id),

  unique (work_package_id, supplier_organization_id)
);

create index routing_decisions_wp_idx on routing_decisions(work_package_id);
create index routing_decisions_supplier_idx
  on routing_decisions(supplier_organization_id);
create index routing_decisions_status_idx on routing_decisions(routing_status);

-- ============================================================================
-- Helpers for RLS
-- ============================================================================

-- Org of the rfq that owns a work package. Used by buyer read visibility.
create or replace function work_package_buyer_org(wp_id uuid) returns uuid
  language sql stable security definer set search_path = public
as $$
  select p.buyer_organization_id
  from work_packages w
  join rfqs r on r.id = w.rfq_id
  join programs p on p.id = r.program_id
  where w.id = wp_id
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table work_packages enable row level security;
alter table work_package_parts enable row level security;
alter table routing_decisions enable row level security;

-- work_packages
-- Asgard admin: full access.
-- Buyer: read their own org's packages (status visibility only).
-- Supplier: no direct visibility.
create policy work_packages_select on work_packages for select
  using (
    is_asgard_admin()
    or work_package_buyer_org(id) = current_user_org()
  );

create policy work_packages_insert on work_packages for insert
  with check (is_asgard_admin());

create policy work_packages_update on work_packages for update
  using (is_asgard_admin())
  with check (is_asgard_admin());

-- work_package_parts
-- Same visibility as parent work package.
create policy wpp_select on work_package_parts for select
  using (
    is_asgard_admin()
    or work_package_buyer_org(work_package_id) = current_user_org()
  );

create policy wpp_insert on work_package_parts for insert
  with check (is_asgard_admin());

create policy wpp_delete on work_package_parts for delete
  using (is_asgard_admin());

-- routing_decisions
-- Asgard admin: full access.
-- Supplier (any supplier role): read only own org's decisions that have been
--   moved to quote_requested. Pending decisions stay hidden until the admin
--   explicitly requests a quote.
-- Buyer: no direct visibility (they track progress via rfq status).
-- Critical: suppliers must NEVER see other suppliers' rows for the same
-- work package. The policy filters only on supplier_organization_id.
create policy routing_decisions_select on routing_decisions for select
  using (
    is_asgard_admin()
    or (
      current_user_role() in ('supplier_admin', 'supplier_user')
      and supplier_organization_id = current_user_org()
      and routing_status = 'quote_requested'
    )
  );

create policy routing_decisions_insert on routing_decisions for insert
  with check (is_asgard_admin());

create policy routing_decisions_update on routing_decisions for update
  using (is_asgard_admin())
  with check (is_asgard_admin());
