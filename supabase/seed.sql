-- supabase/seed.sql
--
-- Dev seed data for Launchbelt. Runs automatically after `supabase db reset`
-- against a local Supabase stack. Idempotent: safe to re-run.
--
-- Creates:
--   • Asgard organization + one asgard_admin user
--   • Acme supplier organization + one supplier_admin user
--
-- Auth users are created directly in auth.users with a known password so a
-- developer can sign in with email+password. Do NOT use this file against a
-- production database — rotate or delete these rows before going live.
--
-- The SQL targets the Supabase auth schema as of the Supabase CLI 1.200+.
-- If the schema has drifted, use the Admin API alternative documented in
-- SETUP.md §5.
--
-- ---------------------------------------------------------------------------
-- Fixed UUIDs so the script is idempotent and deterministic.
-- ---------------------------------------------------------------------------
-- Organizations
--   asgard_org_id    = 00000000-0000-0000-0000-0000000000a1
--   supplier_org_id  = 00000000-0000-0000-0000-0000000000b1
-- Auth / public users (same id in both schemas)
--   asgard_admin_id  = 11111111-1111-1111-1111-111111111111
--   supplier_admin_id= 22222222-2222-2222-2222-222222222222
-- Default passwords (change in a real environment):
--   admin@asgard.dev       → asgard-dev-change-me
--   owner@acme-machining.dev → supplier-dev-change-me
-- ---------------------------------------------------------------------------

begin;

-- Required for crypt() / gen_salt(). Supabase enables this by default,
-- but create it idempotently just in case.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

insert into public.organizations (id, name, type, itar_registered)
values
  ('00000000-0000-0000-0000-0000000000a1', 'Asgard Aerospace', 'asgard', true),
  ('00000000-0000-0000-0000-0000000000b1', 'Acme Machining',  'supplier', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Auth users
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@asgard.dev',
    crypt('asgard-dev-change-me', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'owner@acme-machining.dev',
    crypt('supplier-dev-change-me', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  )
on conflict (id) do nothing;

-- Matching identity rows (required by modern Supabase auth for email login).
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'sub', '11111111-1111-1111-1111-111111111111',
      'email', 'admin@asgard.dev'
    ),
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'sub', '22222222-2222-2222-2222-222222222222',
      'email', 'owner@acme-machining.dev'
    ),
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(), now(), now()
  )
on conflict (provider, provider_id) do nothing;

-- ---------------------------------------------------------------------------
-- public.users (one row per auth user, linked to organization)
-- ---------------------------------------------------------------------------

insert into public.users (id, organization_id, email, role, status)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-0000000000a1',
    'admin@asgard.dev',
    'asgard_admin',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-0000000000b1',
    'owner@acme-machining.dev',
    'supplier_admin',
    'active'
  )
on conflict (id) do nothing;

commit;
