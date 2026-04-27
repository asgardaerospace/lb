-- 0013_intake_scoring.sql  (PROPOSAL — not yet applied)
-- Purpose: scoring model registry + per-application score rows for both
-- intake flows. One score row per (application_id × model_id), re-scorable
-- by re-running the function (UPSERT).

-- ============================================================================
-- scoring_models
-- ============================================================================

create table scoring_models (
  id uuid primary key default gen_random_uuid(),
  kind scoring_model_kind not null,
  version integer not null,
  active boolean not null default true,
  -- Weights as jsonb so dimensions can evolve without schema churn.
  -- Example: {"strategic_value":30,"network_match":25,"onboarding_readiness":20,"revenue_potential":15,"compliance_complexity":10}
  weights jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  unique (kind, version)
);

alter table scoring_models enable row level security;
create policy scoring_models_admin_all on scoring_models
  for all using (is_asgard_admin()) with check (is_asgard_admin());
create policy scoring_models_authenticated_read on scoring_models
  for select using (auth.uid() is not null and active);

-- Seed v1 models. (Idempotent via insert ... where not exists.)
insert into scoring_models (kind, version, weights, description)
select 'customer_fit', 1,
  '{"strategic_value":30,"network_match":25,"onboarding_readiness":20,"revenue_potential":15,"compliance_complexity":10}'::jsonb,
  'Customer fit v1 — per docs/02_DATA_MODEL.md and the onboarding rationale board.'
where not exists (select 1 from scoring_models where kind='customer_fit' and version=1);

insert into scoring_models (kind, version, weights, description)
select 'supplier_readiness', 1,
  '{"capability":25,"compliance":25,"capacity":15,"quality_system":15,"past_performance":10,"data_maturity":10}'::jsonb,
  'Supplier readiness v1 — composite weighted across 6 dimensions.'
where not exists (select 1 from scoring_models where kind='supplier_readiness' and version=1);

-- ============================================================================
-- supplier_readiness_scores
-- ============================================================================

create table supplier_readiness_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references supplier_applications(id) on delete cascade,
  model_id uuid not null references scoring_models(id) on delete restrict,
  composite_score smallint not null check (composite_score between 0 and 100),
  -- Per-dimension breakdown, e.g. {"capability":82,"compliance":95,"capacity":60,...}
  dimensions jsonb not null,
  hard_gate_failures text[] not null default '{}',  -- e.g. ['no_as9100','no_itar']
  computed_at timestamptz not null default now(),
  computed_by uuid references users(id),
  unique (application_id, model_id)
);

create index supplier_readiness_scores_app_idx on supplier_readiness_scores(application_id);

alter table supplier_readiness_scores enable row level security;
create policy supplier_readiness_scores_admin_all on supplier_readiness_scores
  for all using (is_asgard_admin()) with check (is_asgard_admin());
-- Suppliers do NOT see their own readiness score.

-- ============================================================================
-- customer_fit_scores
-- ============================================================================

create table customer_fit_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references customer_applications(id) on delete cascade,
  model_id uuid not null references scoring_models(id) on delete restrict,
  composite_score smallint not null check (composite_score between 0 and 100),
  dimensions jsonb not null,
  -- Derived from composite per the rationale board:
  --   85+ → P0, 70–84 → P1, 55–69 → P2, <55 → 'review'
  derived_priority text,
  computed_at timestamptz not null default now(),
  computed_by uuid references users(id),
  unique (application_id, model_id)
);

create index customer_fit_scores_app_idx on customer_fit_scores(application_id);

alter table customer_fit_scores enable row level security;
create policy customer_fit_scores_admin_all on customer_fit_scores
  for all using (is_asgard_admin()) with check (is_asgard_admin());
-- Customers do NOT see their own fit score.
