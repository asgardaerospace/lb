-- 0009_rfq_compliance_overrides.sql
-- Per-RFQ ITAR / CUI override (follow-up to routing intelligence).
--
-- Programs already carry `itar_controlled` and `cui_controlled` defaults that
-- the routing scoring engine reads. These nullable per-RFQ columns let buyers
-- override the program default for a single RFQ:
--
--   NULL  → inherit the parent program's flag
--   true  → this RFQ requires ITAR / CUI even if the program doesn't
--   false → this RFQ does NOT require it even if the program does
--
-- The routing engine resolves the effective flag with `coalesce(rfq, program)`
-- so existing data continues to behave the same — every RFQ row starts NULL.

alter table rfqs
  add column if not exists itar_override boolean,
  add column if not exists cui_override boolean;
