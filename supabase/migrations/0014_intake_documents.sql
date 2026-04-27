-- 0014_intake_documents.sql
-- Purpose: extend the polymorphic documents table to allow attaching uploads
-- to intake applications. No new table — uses the existing
-- documents.(entity_type, entity_id) pattern from 0006.
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE places a constraint on the same
-- transaction — the new value cannot be *used* in the same transaction
-- in which it is added. We therefore add ONLY the enum values and the
-- enum-free FK in this migration. Convenience helpers and any code that
-- references the new enum values must live in a later migration so they
-- run after this one's commit.

-- ============================================================================
-- 1. Extend the document_entity_type enum
-- ============================================================================

alter type document_entity_type add value if not exists 'supplier_application';
alter type document_entity_type add value if not exists 'customer_application';

-- ============================================================================
-- 2. FK backfill for supplier_application_certifications.document_id
--    (forward-declared in 0011 as a bare uuid). The FK is enum-free, so it
--    is safe to add in the same transaction as the enum additions.
-- ============================================================================

alter table supplier_application_certifications
  add constraint supplier_app_cert_document_fk
  foreign key (document_id) references documents(id) on delete set null;
