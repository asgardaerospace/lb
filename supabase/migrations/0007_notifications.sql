-- 0007_notifications.sql
-- Per-user notification feed (task 07).
-- Notifications are derived from existing audit events but stored separately
-- so each row carries the recipient (user_id) plus a read_at timestamp.
-- Writes happen via service role from the dispatch helper; RLS only governs
-- reads + user-driven updates (mark-as-read).

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,

  action text not null,           -- e.g. 'rfq.submitted', 'quote.accepted'
  entity_type text not null,      -- 'rfq' | 'quote' | 'job' | 'routing_decision'
  entity_id uuid,
  title text not null,
  body text,
  href text,                      -- where the topbar dropdown link should jump to
  metadata jsonb not null default '{}'::jsonb,

  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, created_at desc);
create index notifications_user_unread_idx on notifications(user_id)
  where read_at is null;

alter table notifications enable row level security;

-- A user can read their own notifications. Asgard admins can read all (handy
-- for support / debugging) — same convention as audit_logs.
create policy notifications_select on notifications for select
  using (is_asgard_admin() or user_id = auth.uid());

-- A user can mark their own notifications read.
create policy notifications_update_own on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No anonymous insert/delete: dispatch is service-role only.

-- Publish to Supabase Realtime so the topbar bell can subscribe to inserts /
-- updates on the user's own rows. RLS still gates which rows the channel
-- delivers to a given client. Wrapped in DO so re-running the migration
-- doesn't error on the duplicate-table case.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table notifications;
    end if;
  end if;
end$$;
