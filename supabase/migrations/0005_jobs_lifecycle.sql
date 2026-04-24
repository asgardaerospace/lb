-- 0005_jobs_lifecycle.sql
-- Job execution tracking (task 05).
-- Extends the jobs table created by 0004_quotes_and_jobs.sql with the
-- remaining fields and enum values from /tasks/05_job_execution_tracking.md
-- and /docs/04_WORKFLOWS.md §7, §12. No existing columns or enum values are
-- changed; all additions are backward-compatible with task 04.

-- ============================================================================
-- Extend job_status enum
-- Task chain: awarded → scheduled → in_production → inspection → shipped → complete
-- ============================================================================

alter type job_status add value if not exists 'scheduled';
alter type job_status add value if not exists 'in_production';
alter type job_status add value if not exists 'inspection';
alter type job_status add value if not exists 'shipped';
alter type job_status add value if not exists 'complete';

-- ============================================================================
-- Extend jobs table with task-05 MVP fields and issue-flag columns.
-- All columns are nullable so rows created in task 04 remain valid.
-- ============================================================================

alter table jobs
  add column if not exists job_number text unique,
  add column if not exists start_date date,
  add column if not exists completed_date date,
  add column if not exists last_issue_note text,
  add column if not exists last_issue_flagged_at timestamptz;

-- Trigger to populate job_number on insert when the caller does not provide
-- one (e.g. the task-04 quote-accept handler). Readable short code derived
-- from the UUID so humans can reference jobs without memorizing full UUIDs.
create or replace function set_job_number() returns trigger
  language plpgsql
as $$
begin
  if new.job_number is null then
    new.job_number :=
      'LB-' ||
      upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_set_job_number on jobs;
create trigger jobs_set_job_number
  before insert on jobs
  for each row
  execute function set_job_number();

-- Backfill any task-04 jobs that predate the trigger.
update jobs
  set job_number = 'LB-' || upper(substr(replace(id::text, '-', ''), 1, 8))
  where job_number is null;

-- ============================================================================
-- Additive RLS: suppliers may update their own job rows.
-- The admin update policy from 0004 is unchanged; the two policies OR together.
-- Column-level restrictions (supplier must not alter supplier_organization_id,
-- work_package_id, etc.) are enforced by the API handlers.
-- ============================================================================

create policy jobs_update_supplier on jobs for update
  using (
    current_user_role() in ('supplier_admin', 'supplier_user')
    and supplier_organization_id = current_user_org()
  )
  with check (
    supplier_organization_id = current_user_org()
  );
