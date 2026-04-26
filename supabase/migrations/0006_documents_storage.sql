-- 0006_documents_storage.sql
-- Document upload + storage linkage (task 06).
-- Extends the existing `documents` table from 0001 with entity-link metadata
-- (rfq / part / quote / job) so uploads can be attached to workflow records.
-- All additions are nullable to keep the supplier-profile rows valid.
-- Storage bucket convention: launchbelt-documents (private). API handlers use
-- the service role to issue signed URLs and enforce access via role + org.

-- ============================================================================
-- Enum: which workflow entity does the document belong to?
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_entity_type') then
    create type document_entity_type as enum ('rfq', 'part', 'quote', 'job');
  end if;
end$$;

-- ============================================================================
-- Extend documents
-- ============================================================================

alter table documents
  add column if not exists entity_type document_entity_type,
  add column if not exists entity_id uuid,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists description text;

create index if not exists documents_entity_idx
  on documents(entity_type, entity_id);
create index if not exists documents_org_idx
  on documents(organization_id);

-- ============================================================================
-- Audit-log entity_type expansion is unnecessary because audit_logs.entity_type
-- is `text`. We just emit 'document' as the entity type from the API handler.
-- ============================================================================
