-- 0010_intake_enums.sql  (PROPOSAL — not yet applied)
-- Purpose: enum types shared by the intake migrations (0011–0015).
-- Idempotent guards so it can be re-run safely against partial state.
--
-- This file is intentionally located under supabase/proposed/ and is NOT
-- picked up by the Supabase CLI migration runner. Promote by moving into
-- supabase/migrations/ when ready.

-- ============================================================================
-- Supplier intake status
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'supplier_application_status') then
    create type supplier_application_status as enum (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'revisions_requested',
      'withdrawn'
    );
  end if;
end$$;

-- ============================================================================
-- Customer intake status
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_application_status') then
    create type customer_application_status as enum (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'revisions_requested',
      'withdrawn'
    );
  end if;
end$$;

-- ============================================================================
-- Customer-side classifiers
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_tier') then
    create type customer_tier as enum (
      'defense_prime',
      'itar_controlled',
      'growth_stage',
      'enterprise'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_org_type') then
    create type customer_org_type as enum (
      'startup', 'prime', 'oem', 'enterprise', 'gov'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_funding_stage') then
    create type customer_funding_stage as enum (
      'bootstrap', 'seed', 'series_a', 'series_b', 'series_c', 'public', 'enterprise'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_geography') then
    create type customer_geography as enum (
      'domestic_only', 'five_eyes', 'global'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_lead_tolerance') then
    create type customer_lead_tolerance as enum (
      'strict', 'moderate', 'flexible'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_program_stage') then
    create type customer_program_stage as enum (
      'concept', 'prototype', 'lrip', 'production'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_first_use_action') then
    create type customer_first_use_action as enum (
      'first_part', 'first_program', 'pilot_rfq'
    );
  end if;
end$$;

-- ============================================================================
-- Scoring model kind
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'scoring_model_kind') then
    create type scoring_model_kind as enum (
      'supplier_readiness',
      'customer_fit'
    );
  end if;
end$$;
