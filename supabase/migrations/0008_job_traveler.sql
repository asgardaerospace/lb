-- 0008_job_traveler.sql
-- Digital traveler (task 11): per-job ledger of step completions.
--
-- One row is appended each time a job transitions through a traveler step.
-- The four canonical steps are scheduled → in_production → inspection →
-- complete. The shipped job status maps onto the `complete` traveler step
-- (any move into shipped/complete records `complete`).
--
-- Writes go via the service role from the API status handlers using
-- INSERT ... ON CONFLICT DO NOTHING so duplicate transitions are idempotent.

create type traveler_step as enum (
  'scheduled',
  'in_production',
  'inspection',
  'complete'
);

create table job_traveler_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  step traveler_step not null,
  completed_at timestamptz not null default now(),
  completed_by uuid references users(id),
  note text,
  created_at timestamptz not null default now(),
  unique (job_id, step)
);

create index job_traveler_steps_job_idx on job_traveler_steps(job_id);

alter table job_traveler_steps enable row level security;

-- Visibility mirrors the jobs table: admin sees all, supplier sees its own
-- jobs, buyer sees jobs whose program they own. Implemented via direct join.
create policy job_traveler_steps_select on job_traveler_steps for select
  using (
    is_asgard_admin()
    or exists (
      select 1
      from jobs j
      where j.id = job_traveler_steps.job_id
        and j.supplier_organization_id = current_user_org()
    )
    or exists (
      select 1
      from jobs j
      join work_packages wp on wp.id = j.work_package_id
      join rfqs r on r.id = wp.rfq_id
      join programs p on p.id = r.program_id
      where j.id = job_traveler_steps.job_id
        and p.buyer_organization_id = current_user_org()
    )
  );

-- No anonymous insert/update/delete: status handlers run service-role.
