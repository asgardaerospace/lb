-- 0015_customer_application_conversion.sql
-- Phase 4 (customer-only). Materializes operational customer_profiles +
-- routing weights + supplier filter from an approved customer_application,
-- and provisions a buyer organization if the intake was anonymous.
--
-- The supplier-side conversion stays parked under
-- supabase/proposed/0015_supplier_application_conversion.sql until the
-- supplier intake flow is built out.
--
-- Side effects on a successful call:
--   1. organizations row provisioned if customer_application.organization_id IS NULL
--   2. customer_profiles row inserted/updated (UPSERT on organization_id)
--   3. customer_routing_weights row inserted/updated (UPSERT on customer_profile_id)
--   4. customer_supplier_filters row inserted/updated (UPSERT on customer_profile_id)
--   5. customer_applications.{converted_profile_id, converted_at, status='converted'} set
--   6. audit_logs row inserted with action='customer_application.converted'
--
-- Status transition: only allowed from 'approved'. Once a row is 'converted'
-- the function refuses to re-run; reset to 'approved' explicitly to re-convert.

-- ============================================================================
-- 1. Extend customer_application_status with the new terminal state.
-- ============================================================================

alter type customer_application_status add value if not exists 'converted';

-- ============================================================================
-- 2. Linkage columns (FK constraints completing the loop declared in 0012).
-- ============================================================================

alter table customer_applications
  add constraint customer_applications_converted_profile_fk
  foreign key (converted_profile_id) references customer_profiles(id) on delete set null;

alter table customer_profiles
  add constraint customer_profiles_source_application_fk
  foreign key (source_application_id) references customer_applications(id) on delete set null;

create index if not exists customer_profiles_source_application_idx
  on customer_profiles(source_application_id);

-- ============================================================================
-- 3. convert_customer_application(application_id, admin_user_id)
-- Returns jsonb { profile_id, organization_id, application_id, status,
--                 organization_created, profile_created }
-- ============================================================================

create or replace function convert_customer_application(
  p_application_id uuid,
  p_admin_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_app customer_applications%rowtype;
  v_org_id uuid;
  v_org_created boolean := false;
  v_profile_id uuid;
  v_profile_created boolean := false;
  v_subdomain text;
  v_data_residency text;
  v_sso_provider text;
  v_workspace_name text;
  v_audit_retention integer;
begin
  -- Lock-load the application row.
  select * into v_app
  from customer_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'customer_application not found: %', p_application_id
      using errcode = 'P0002';
  end if;

  if v_app.status <> 'approved' then
    raise exception 'customer_application % is not approved (status=%); reset to approved before re-conversion',
      p_application_id, v_app.status
      using errcode = 'P0001';
  end if;

  -- 3.1 Provision a buyer organization if the intake was anonymous.
  if v_app.organization_id is null then
    insert into organizations (name, type, itar_registered)
    values (v_app.legal_name, 'buyer', v_app.itar)
    returning id into v_org_id;

    update customer_applications
       set organization_id = v_org_id
     where id = p_application_id;

    v_app.organization_id := v_org_id;
    v_org_created := true;
  else
    v_org_id := v_app.organization_id;
  end if;

  -- 3.2 Compute workspace defaults from the application + payload, with
  -- safe fallbacks so NOT NULL columns never blow up.
  v_subdomain := nullif(trim(coalesce(v_app.workspace_subdomain, '')), '');
  if v_subdomain is null then
    -- Slug from legal_name + short application id suffix to avoid collisions.
    v_subdomain := lower(regexp_replace(v_app.legal_name, '[^a-zA-Z0-9]+', '-', 'g'))
                || '-' || substr(p_application_id::text, 1, 8);
    -- Trim leading/trailing hyphens.
    v_subdomain := regexp_replace(v_subdomain, '^-+|-+$', '', 'g');
    if length(v_subdomain) = 0 then
      v_subdomain := 'workspace-' || substr(p_application_id::text, 1, 8);
    end if;
  end if;

  v_data_residency := coalesce(v_app.data_residency, 'us_east');
  v_sso_provider   := coalesce(v_app.sso_provider, 'None');
  v_workspace_name := coalesce(v_app.workspace_name, v_app.legal_name);
  v_audit_retention := coalesce(
    nullif(v_app.payload->>'audit_log_retention_yrs', '')::integer,
    7
  );

  -- 3.3 Track whether this is a fresh customer_profiles row.
  select exists(select 1 from customer_profiles where organization_id = v_org_id)
    into v_profile_created;
  v_profile_created := not v_profile_created;

  -- 3.4 UPSERT customer_profiles by organization_id.
  insert into customer_profiles (
    organization_id, source_application_id, tier,
    workspace_name, workspace_subdomain, data_residency, sso_provider,
    audit_log_retention_yrs, workspace_status, created_by
  )
  values (
    v_org_id, p_application_id, v_app.derived_tier,
    v_workspace_name, v_subdomain, v_data_residency, v_sso_provider,
    v_audit_retention, 'provisioning', p_admin_user_id
  )
  on conflict (organization_id) do update set
    source_application_id   = excluded.source_application_id,
    tier                    = excluded.tier,
    workspace_name          = excluded.workspace_name,
    workspace_subdomain     = excluded.workspace_subdomain,
    data_residency          = excluded.data_residency,
    sso_provider            = excluded.sso_provider,
    audit_log_retention_yrs = excluded.audit_log_retention_yrs,
    updated_at              = now()
  returning id into v_profile_id;

  -- 3.5 Routing weights — derived from cost_vs_speed slider + soft prefs.
  insert into customer_routing_weights (
    customer_profile_id, cost_weight, speed_weight, risk_penalty_weight,
    geography_weight, preferred_regions, preferred_supplier_traits
  )
  values (
    v_profile_id,
    100 - v_app.cost_vs_speed,
    v_app.cost_vs_speed,
    case lower(coalesce(v_app.risk_tolerance, 'medium'))
      when 'low' then 80
      when 'high' then 20
      else 50
    end,
    case v_app.geography
      when 'domestic_only' then 90
      when 'five_eyes' then 60
      else 40
    end,
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(v_app.payload->'supply_chain'->'regions', '[]'::jsonb)
        )
      ),
      '{}'::text[]
    ),
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(v_app.payload->'supply_chain'->'preferred_supplier_types', '[]'::jsonb)
        )
      ),
      '{}'::text[]
    )
  )
  on conflict (customer_profile_id) do update set
    cost_weight               = excluded.cost_weight,
    speed_weight              = excluded.speed_weight,
    risk_penalty_weight       = excluded.risk_penalty_weight,
    geography_weight          = excluded.geography_weight,
    preferred_regions         = excluded.preferred_regions,
    preferred_supplier_traits = excluded.preferred_supplier_traits,
    updated_at                = now();

  -- 3.6 Hard-gate supplier filter expression.
  insert into customer_supplier_filters (customer_profile_id, filter_expression)
  values (
    v_profile_id,
    jsonb_build_object(
      'itar_required',     v_app.itar,
      'cui_required',      v_app.cui,
      'as9100_required',   v_app.as9100,
      'nadcap_required',   v_app.nadcap,
      'dpas_required',     coalesce((v_app.payload->'supply_chain'->>'requires_dpas')::boolean, false),
      'buy_american_act',  coalesce((v_app.payload->'supply_chain'->>'buy_american_act')::boolean, false),
      'berry_amendment',   coalesce((v_app.payload->'supply_chain'->>'berry_amendment')::boolean, false),
      'geography',         v_app.geography,
      'cmmc_minimum',      v_app.cmmc_level,
      'suppliers_per_part', v_app.suppliers_per_part
    )
  )
  on conflict (customer_profile_id) do update set
    filter_expression = excluded.filter_expression,
    updated_at        = now();

  -- 3.7 Mark conversion + flip terminal status.
  update customer_applications
     set converted_profile_id = v_profile_id,
         converted_at         = now(),
         status               = 'converted'
   where id = p_application_id;

  -- 3.8 Audit log.
  insert into audit_logs (action, entity_type, entity_id, organization_id, user_id, metadata)
  values (
    'customer_application.converted',
    'customer_profile',
    v_profile_id,
    v_org_id,
    p_admin_user_id,
    jsonb_build_object(
      'application_id',      p_application_id,
      'application_version', v_app.version,
      'tier',                v_app.derived_tier,
      'organization_created', v_org_created,
      'profile_created',     v_profile_created,
      'workspace_subdomain', v_subdomain
    )
  );

  return jsonb_build_object(
    'profile_id',           v_profile_id,
    'organization_id',      v_org_id,
    'application_id',       p_application_id,
    'status',               'converted',
    'organization_created', v_org_created,
    'profile_created',      v_profile_created,
    'workspace_subdomain',  v_subdomain
  );
end$$;

comment on function convert_customer_application(uuid, uuid) is
  'Materializes a customer_profile + routing weights + supplier filter from an approved customer_application. Provisions a buyer organization if the intake was anonymous. Idempotent within a single run via UPSERTs; refuses re-runs once status=converted.';

-- ============================================================================
-- 4. Auto-conversion trigger
--
-- INTENTIONALLY OMITTED. Conversion is an explicit reviewer action — wiring
-- it to a trigger on status='approved' would mutate live operational tables
-- on every approval without the reviewer being aware. The admin console
-- calls convert_customer_application(...) explicitly via the
-- "Convert to customer profile" button.
-- ============================================================================
