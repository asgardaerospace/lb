-- 0016_supplier_application_conversion.sql
-- Phase 4 (supplier-only). Materializes operational supplier_profiles +
-- certifications + machines + capabilities from an approved
-- supplier_application, and provisions a supplier organization if the
-- intake was anonymous.
--
-- Mirrors supabase/migrations/0015_customer_application_conversion.sql.
--
-- Side effects on a successful call:
--   1. organizations row provisioned if supplier_application.organization_id IS NULL
--   2. supplier_profiles row inserted/updated (UPSERT on organization_id)
--   3. certifications, machines, capabilities child rows refreshed for the org
--   4. supplier_applications.{converted_profile_id, converted_at, status='converted'} set
--   5. audit_logs row inserted with action='supplier_application.converted'
--
-- Status transition: only allowed from 'approved'. Once a row is 'converted'
-- the function refuses to re-run; reset to 'approved' explicitly to re-convert.

-- ============================================================================
-- 1. Extend supplier_application_status with the new terminal state.
-- ============================================================================

alter type supplier_application_status add value if not exists 'converted';

-- ============================================================================
-- 2. Linkage columns (FK constraint completing the loop declared in 0011).
-- ============================================================================

alter table supplier_applications
  add constraint supplier_applications_converted_profile_fk
  foreign key (converted_profile_id) references supplier_profiles(id) on delete set null;

alter table supplier_profiles
  add column source_application_id uuid references supplier_applications(id) on delete set null;

create index if not exists supplier_profiles_source_application_idx
  on supplier_profiles(source_application_id);

-- ============================================================================
-- 3. convert_supplier_application(application_id, admin_user_id)
-- Returns jsonb { profile_id, organization_id, application_id, status,
--                 organization_created, profile_created }
-- ============================================================================

create or replace function convert_supplier_application(
  p_application_id uuid,
  p_admin_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_app supplier_applications%rowtype;
  v_org_id uuid;
  v_org_created boolean := false;
  v_profile_id uuid;
  v_profile_created boolean := false;
  v_cert_count integer := 0;
  v_machine_count integer := 0;
  v_capability_count integer := 0;
begin
  -- Lock-load the application row.
  select * into v_app
  from supplier_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'supplier_application not found: %', p_application_id
      using errcode = 'P0002';
  end if;

  if v_app.status <> 'approved' then
    raise exception 'supplier_application % is not approved (status=%); reset to approved before re-conversion',
      p_application_id, v_app.status
      using errcode = 'P0001';
  end if;

  -- 3.1 Provision a supplier organization if the intake was anonymous.
  if v_app.organization_id is null then
    insert into organizations (name, type, itar_registered)
    values (v_app.legal_name, 'supplier', v_app.itar_registered)
    returning id into v_org_id;

    update supplier_applications
       set organization_id = v_org_id
     where id = p_application_id;

    v_app.organization_id := v_org_id;
    v_org_created := true;
  else
    v_org_id := v_app.organization_id;
  end if;

  -- 3.2 Track whether this is a fresh supplier_profiles row.
  select exists(select 1 from supplier_profiles where organization_id = v_org_id)
    into v_profile_created;
  v_profile_created := not v_profile_created;

  -- 3.3 UPSERT supplier_profiles by organization_id (the existing UNIQUE).
  insert into supplier_profiles (
    organization_id, source_application_id, approval_status,
    company_summary, facility_size_sqft, employee_count,
    quality_system_notes, capacity_notes,
    as9100_certified, iso9001_certified, itar_registered, cmmc_status,
    submitted_at, reviewed_at, reviewed_by, review_notes,
    created_by
  )
  values (
    v_org_id, p_application_id, 'approved',
    v_app.payload->>'company_summary',
    nullif(v_app.payload->>'facility_size_sqft', '')::integer,
    coalesce(
      v_app.team_size,
      nullif(v_app.payload->>'employee_count', '')::integer
    ),
    v_app.payload->>'quality_system_notes',
    v_app.payload->>'capacity_notes',
    coalesce(
      (v_app.payload->>'as9100_certified')::boolean,
      exists (
        select 1 from supplier_application_certifications
        where application_id = p_application_id
          and upper(cert_type) like '%AS9100%'
      )
    ),
    coalesce(
      (v_app.payload->>'iso9001_certified')::boolean,
      exists (
        select 1 from supplier_application_certifications
        where application_id = p_application_id
          and upper(cert_type) like '%ISO9001%'
      )
    ),
    v_app.itar_registered,
    v_app.cmmc_level,
    v_app.submitted_at,
    v_app.reviewed_at,
    v_app.reviewed_by,
    v_app.decision_notes,
    p_admin_user_id
  )
  on conflict (organization_id) do update set
    source_application_id = excluded.source_application_id,
    approval_status       = excluded.approval_status,
    company_summary       = excluded.company_summary,
    facility_size_sqft    = excluded.facility_size_sqft,
    employee_count        = excluded.employee_count,
    quality_system_notes  = excluded.quality_system_notes,
    capacity_notes        = excluded.capacity_notes,
    as9100_certified      = excluded.as9100_certified,
    iso9001_certified     = excluded.iso9001_certified,
    itar_registered       = excluded.itar_registered,
    cmmc_status           = excluded.cmmc_status,
    reviewed_at           = excluded.reviewed_at,
    reviewed_by           = excluded.reviewed_by,
    review_notes          = excluded.review_notes,
    updated_at            = now()
  returning id into v_profile_id;

  -- 3.4 Materialize child tables. Strategy: delete + insert (intake
  -- snapshot wins; manual operator edits to the operational tables are
  -- overwritten on every re-conversion).

  delete from certifications where organization_id = v_org_id;
  insert into certifications (
    organization_id, type, expiration_date, verification_status, created_by
  )
  select v_org_id, cert_type, expiration_date, 'unverified', p_admin_user_id
  from supplier_application_certifications
  where application_id = p_application_id;
  get diagnostics v_cert_count = row_count;

  delete from machines where organization_id = v_org_id;
  insert into machines (
    organization_id, machine_type, materials_supported, capacity, created_by
  )
  select
    v_org_id,
    machine_type,
    materials_supported,
    nullif(
      trim(
        coalesce(envelope, '') ||
        case when count > 1 then ' (x' || count::text || ')' else '' end
      ),
      ''
    ),
    p_admin_user_id
  from supplier_application_machines
  where application_id = p_application_id;
  get diagnostics v_machine_count = row_count;

  delete from capabilities where organization_id = v_org_id;
  insert into capabilities (
    organization_id, process_type, materials_supported, created_by
  )
  select v_org_id, process_type, materials, p_admin_user_id
  from supplier_application_capabilities
  where application_id = p_application_id;
  get diagnostics v_capability_count = row_count;

  -- 3.5 Mark conversion + flip terminal status.
  update supplier_applications
     set converted_profile_id = v_profile_id,
         converted_at         = now(),
         status               = 'converted'
   where id = p_application_id;

  -- 3.6 Audit log.
  insert into audit_logs (action, entity_type, entity_id, organization_id, user_id, metadata)
  values (
    'supplier_application.converted',
    'supplier_profile',
    v_profile_id,
    v_org_id,
    p_admin_user_id,
    jsonb_build_object(
      'application_id',       p_application_id,
      'application_version',  v_app.version,
      'organization_created', v_org_created,
      'profile_created',      v_profile_created,
      'cert_count',           v_cert_count,
      'machine_count',        v_machine_count,
      'capability_count',     v_capability_count
    )
  );

  return jsonb_build_object(
    'profile_id',           v_profile_id,
    'organization_id',      v_org_id,
    'application_id',       p_application_id,
    'status',               'converted',
    'organization_created', v_org_created,
    'profile_created',      v_profile_created,
    'cert_count',           v_cert_count,
    'machine_count',        v_machine_count,
    'capability_count',     v_capability_count
  );
end$$;

comment on function convert_supplier_application(uuid, uuid) is
  'Materializes a supplier_profile + certifications + machines + capabilities from an approved supplier_application. Provisions a supplier organization if the intake was anonymous. Idempotent within a single run via UPSERT/delete-then-insert; refuses re-runs once status=converted.';

-- ============================================================================
-- 4. Auto-conversion trigger
--
-- INTENTIONALLY OMITTED. Conversion is an explicit reviewer action — wiring
-- it to a trigger on status='approved' would mutate live operational tables
-- on every approval without the reviewer being aware. The admin console
-- calls convert_supplier_application(...) explicitly via the
-- "Convert to supplier profile" button.
-- ============================================================================
