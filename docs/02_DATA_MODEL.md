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

Owned by a buyer organization. One program groups multiple RFQs.

Fields:
- id (uuid)
- buyer_organization_id (uuid, fk → organizations.id)
- program_name (text, required)
- program_type (text, optional — e.g. `prototype`, `production`)
- description (text)
- compliance_level (text, optional — e.g. `standard`, `AS9100`)
- itar_controlled (boolean, default false)
- cui_controlled (boolean, default false)
- status (enum: `active`, `archived`, default `active`)
- created_at, updated_at, created_by

---

## RFQs

Fields:
- id (uuid)
- program_id (uuid, fk → programs.id)
- rfq_title (text, required)
- description (text)
- quantity (integer)
- required_delivery_date (date)
- priority (enum: `low`, `normal`, `high`, `urgent`, default `normal`)
- status (enum: `draft`, `submitted`, `routing_in_progress`, `quotes_requested`; future: `awarded`, `closed`)
- submitted_at (timestamptz)
- created_at, updated_at, created_by

---

## Parts

Parts belong to an RFQ. They do not currently carry a lifecycle state —
part-level status tracking (`draft → routed → in_production → complete` in
`/docs/04_WORKFLOWS.md §12`) is deferred. Movement through the system is
tracked at the work-package and job level instead.

Fields:
- id (uuid)
- rfq_id (uuid, fk → rfqs.id)
- part_number (text, required)
- part_name (text)
- revision (text)
- material (text)
- process_required (text)
- quantity (integer)
- tolerance_notes (text)
- finish_requirements (text)
- inspection_requirements (text)
- created_at, updated_at, created_by

---

## Work Packages

Admin-created units of routable work. One RFQ can have many work packages;
parts are linked via the `work_package_parts` junction.

Fields:
- id (uuid)
- rfq_id (uuid, fk → rfqs.id)
- package_name (text, required)
- package_type (text, optional — e.g. `machined`, `assembly`)
- description (text)
- status (enum: `open`, `routed`, default `open`)
- created_at, updated_at, created_by

---

## Work Package Parts

Junction between `work_packages` and `parts`. Many-to-many to allow a part
to be split across packages in future workflows (task 03 does not currently
enforce exclusivity at the handler level either).

Fields:
- work_package_id (uuid, fk → work_packages.id) — pk component
- part_id (uuid, fk → parts.id) — pk component
- created_at, created_by

Composite primary key: (`work_package_id`, `part_id`).

---

## Routing Decisions

One row per (work_package, candidate supplier). Created by asgard_admin in
the routing console.

Fields:
- id (uuid)
- work_package_id (uuid, fk → work_packages.id)
- supplier_organization_id (uuid, fk → organizations.id)
- capability_fit_score (integer, 0–100)
- capacity_fit_score (integer, 0–100)
- compliance_fit_score (integer, 0–100)
- schedule_fit_score (integer, 0–100)
- routing_rationale (text)
- routing_status (enum: `pending`, `quote_requested`, default `pending`)
- quote_requested_at (timestamptz)
- created_at, updated_at, created_by

Unique (`work_package_id`, `supplier_organization_id`) — a given supplier
can appear on a package's candidate list at most once.

---

## Quotes

Supplier's response to a routing decision. Identified by the pair
(`work_package_id`, `supplier_organization_id`). Related to a routing
decision implicitly, not via foreign key.

Fields:
- id (uuid)
- work_package_id (uuid, fk → work_packages.id)
- supplier_organization_id (uuid, fk → organizations.id)
- quoted_price (numeric(15,2))
- lead_time_days (integer)
- minimum_order_quantity (integer)
- quote_notes (text)
- status (enum: `draft`, `submitted`, `under_review`, `accepted`, `rejected`, `declined`)
- submitted_at (timestamptz)
- reviewed_at (timestamptz)
- reviewed_by (uuid, fk → users.id)
- review_notes (text)
- created_at, updated_at, created_by

Unique (`work_package_id`, `supplier_organization_id`).

---

## Jobs

Created automatically by the quote-accept handler. Represents production
owned by a supplier organization.

Fields:
- id (uuid)
- job_number (text, unique — generated from id via trigger if not provided)
- work_package_id (uuid, fk → work_packages.id)
- supplier_organization_id (uuid, fk → organizations.id)
- quote_id (uuid, fk → quotes.id, nullable)
- status (enum: `awarded`, `scheduled`, `in_production`, `inspection`, `shipped`, `complete`)
- start_date (date)
- due_date (date)
- completed_date (date)
- last_issue_note (text)
- last_issue_flagged_at (timestamptz)
- created_at, updated_at, created_by

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

Current action vocabulary:

Supplier profile (task 01):
- `supplier_profile.submitted`
- `supplier_profile.approved`
- `supplier_profile.rejected`
- `supplier_profile.revisions_requested`

RFQ intake (task 02):
- `program.created`
- `rfq.created`
- `rfq.submitted`

Routing (task 03):
- `work_package.created`
- `routing_decision.created`
- `routing_decision.quote_requested`

Quote workflow (task 04):
- `quote.submitted`
- `quote.declined`
- `quote.accepted`
- `quote.rejected`
- `job.created`

Job execution (task 05):
- `job.status_updated`   (supplier-driven forward transitions)
- `job.status_overridden` (admin override, any-to-any)
- `job.issue_flagged`    (supplier or admin)

New modules must extend this vocabulary rather than reusing existing actions.

Current `entity_type` values: `supplier_profile`, `program`, `rfq`,
`work_package`, `routing_decision`, `quote`, `job`.

---

# 3. Relationships

- Organization → Users (1:N)
- Organization → Supplier Profile (1:1)
- Buyer Organization → Programs (1:N)
- Program → RFQs (1:N)
- RFQ → Parts (1:N)
- RFQ → Work Packages (1:N)
- Work Package ↔ Parts (M:N, via `work_package_parts`)
- Work Package → Routing Decisions (1:N, one per candidate supplier)
- Routing Decision → Supplier Organization (N:1)
- Work Package + Supplier Organization → Quote (1:1 via unique constraint)
- Quote → Job (1:0..1, on quote acceptance)
- Work Package → Job (1:N, though currently 1:1 in practice)
- Job → Documents (1:N, placeholder — not yet wired)

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

Tables present in migrations `0001` – `0005`:

- organizations
- users
- supplier_profiles
- certifications (declared, unused by MVP tasks)
- machines (declared, unused)
- capabilities (declared, unused)
- documents (declared, unused — storage layer not yet wired)
- audit_logs
- programs
- rfqs
- parts
- work_packages
- work_package_parts
- routing_decisions
- quotes
- jobs

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