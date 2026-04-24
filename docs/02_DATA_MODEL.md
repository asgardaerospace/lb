# Launchbelt Data Model

## Purpose

This document defines what data exists in Launchbelt and how it is structured.

It is the single source of truth for:

- Entities  
- Fields  
- Relationships  

---

# 1. Core Principles

## Organization Scoped

All records must include:

organization_id

---

## Role-Based Access

Users belong to one of five granular roles. The first word indicates the
organization type; the second indicates the privilege tier within that org.

- `asgard_admin` — platform operator (full access, routing authority)
- `supplier_admin` — can edit and submit the supplier profile, manage the
  supplier organization
- `supplier_user` — read-only access to the supplier organization
- `buyer_admin` — can create programs and RFQs for the buyer organization
- `buyer_user` — read-only access to the buyer organization

Legacy shorthand ("Admin / Supplier / Buyer") maps to the organization type,
not to a user role. Always use the granular role when enforcing access.

---

## Auditability

All tables include:

- created_at  
- updated_at  
- created_by  
- status  

---

# 2. Core Entities

## Organizations

Represents companies on the platform.

Fields:
- id  
- name  
- type (asgard, supplier, buyer)  
- itar_registered  
- created_at  

---

## Users

Represents system users. The `id` mirrors the Supabase Auth user id
(`auth.users.id`).

Fields:
- id (uuid, = auth.users.id)
- organization_id (uuid, fk → organizations.id)
- email (text, unique)
- role (enum: `asgard_admin`, `supplier_admin`, `supplier_user`, `buyer_admin`, `buyer_user`)
- status (enum: `active`, `invited`, `disabled`)
- created_at
- updated_at

---

## Supplier Profiles

One row per supplier organization (`organization_id` is unique).

Fields:
- id (uuid)
- organization_id (uuid, unique, fk → organizations.id)
- approval_status (enum: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `revisions_requested`)

Profile content:
- company_summary (text)
- facility_size_sqft (integer)
- employee_count (integer)
- quality_system_notes (text)
- capacity_notes (text)

Compliance booleans and status:
- as9100_certified (boolean)
- iso9001_certified (boolean)
- itar_registered (boolean)
- cmmc_status (enum: `none`, `level_1`, `level_2`, `level_3`)

Review metadata:
- submitted_at (timestamptz)
- reviewed_at (timestamptz)
- reviewed_by (uuid, fk → users.id)
- review_notes (text)

Audit columns:
- created_at, updated_at, created_by

Detailed certifications, machines, and capabilities are maintained in their
own tables below and are linked to the same `organization_id`. The booleans
above are self-attested flags used for fast filtering during routing; they do
not replace the evidence uploaded into `certifications` and `documents`.

---

## Certifications

Fields:
- id  
- organization_id  
- type  
- expiration_date  
- verification_status  

---

## Machines

Fields:
- id  
- organization_id  
- machine_type  
- materials_supported  
- capacity  

---

## Capabilities

Fields:
- id  
- organization_id  
- process_type  
- materials_supported  

---

## Programs

Fields:
- id  
- buyer_organization_id  
- name  
- compliance_level  
- status  

---

## RFQs

Fields:
- id  
- program_id  
- quantity  
- delivery_date  
- status  

---

## Parts

Fields:
- id  
- rfq_id  
- material  
- process_required  
- quantity  

---

## Work Packages

Fields:
- id  
- rfq_id  
- type  
- status  

---

## Routing Decisions

Fields:
- id  
- work_package_id  
- supplier_id  
- fit_scores  
- rationale  

---

## Quotes

Fields:
- id  
- supplier_id  
- price  
- lead_time  
- status  

---

## Jobs

Fields:
- id  
- supplier_id  
- work_package_id  
- status  
- due_date  

---

## Documents

Fields:
- id  
- organization_id  
- file_type  
- storage_path  
- compliance_flags  

---

## Audit Logs

Append-only. Writes go through the service role; no update or delete is
permitted. Every state-changing critical action must log exactly one row.

Fields:
- id (uuid)
- user_id (uuid, fk → users.id) — the actor
- organization_id (uuid, fk → organizations.id) — the actor's org, for org-scoped queries
- action (text) — dotted identifier, e.g. `supplier_profile.submitted`
- entity_type (text) — the affected entity kind, e.g. `supplier_profile`
- entity_id (uuid) — the affected entity's primary key
- metadata (jsonb) — structured context such as `previous_status`,
  `supplier_organization_id`, `review_notes`
- timestamp (timestamptz)

Current action vocabulary (supplier profile module):
- `supplier_profile.submitted`
- `supplier_profile.approved`
- `supplier_profile.rejected`
- `supplier_profile.revisions_requested`

New modules must extend this vocabulary rather than reusing existing actions.

---

# 3. Relationships

- Organization → Users  
- Organization → Supplier Profile  
- Buyer → Programs  
- Program → RFQs  
- RFQ → Parts  
- Work Package → Parts  
- Work Package → Routing Decisions  
- Routing Decision → Supplier  
- Supplier → Quotes  
- Quote → Job  
- Job → Documents  

---

# 4. Access Rules

Admin:
- Full access  

Supplier:
- Own data only  

Buyer:
- Own programs only  

---

# 5. MVP Tables

Start with:

- organizations  
- users  
- supplier_profiles  
- programs  
- rfqs  
- parts  
- routing_decisions  
- quotes  
- jobs  
- documents  

---

# 6. Constraints

- All data must be scoped  
- Relationships must be enforced  
- No duplicate sources of truth  

---

# 7. Claude Instructions

- Do not invent fields  
- Do not modify schema without updating this doc  
- Enforce relationships  
- Maintain consistency  

---

# 8. Strategic Alignment

This data model enables:

- Routing orchestration  
- Supplier matching  
- Compliance tracking  
- Scalable production coordination  