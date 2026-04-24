# Launchbelt API Specification

## Purpose

This document defines the initial API surface for Launchbelt.

It governs:

- Endpoint structure
- Request formats
- Response formats
- Role-based access
- Workflow enforcement

All API behavior must align with the data model, workflows, and user permissions.

---

# 1. API Principles

## 1.1 Backend Owns Logic

The API enforces:

- Permissions
- Validation
- State transitions
- Audit logging

The frontend must never enforce critical business logic alone.

---

## 1.2 Organization Scoping

Every request must be scoped by:

- authenticated user
- organization_id
- role

---

## 1.3 Auditability

Critical API actions must create audit log entries.

Examples:

- RFQ submission
- Supplier approval
- Routing decision
- Quote submission
- Job award
- Document upload

---

# 2. Auth Endpoints

## GET `/api/me`

Returns the current user profile.

### Auth

Any authenticated user.

### Response

```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "email": "user@company.com",
  "role": "buyer_admin"
}
```

`role` is one of the granular roles defined in `/docs/02_DATA_MODEL.md`:
`asgard_admin`, `supplier_admin`, `supplier_user`, `buyer_admin`, `buyer_user`.

### Error responses

- `401` — not authenticated or user profile not found
- `403` — user status is not `active`

---

# 3. Supplier Profile Endpoints

All endpoints enforce organization scoping (`organization_id` is resolved from
the session, never from the request body) and write audit log entries on state
transitions. State transitions follow `/docs/04_WORKFLOWS.md` — any disallowed
transition returns `409 Conflict`.

## GET `/api/supplier/profile`

Returns the supplier profile for the caller's organization, or `null` if none
exists yet.

### Auth

`supplier_admin`, `supplier_user`

### Response

```json
{
  "profile": {
    "id": "uuid",
    "organization_id": "uuid",
    "approval_status": "draft",
    "company_summary": "...",
    "facility_size_sqft": 12000,
    "employee_count": 45,
    "quality_system_notes": "...",
    "capacity_notes": "...",
    "as9100_certified": true,
    "iso9001_certified": true,
    "itar_registered": false,
    "cmmc_status": "level_1",
    "submitted_at": null,
    "reviewed_at": null,
    "reviewed_by": null,
    "review_notes": null,
    "created_at": "...",
    "updated_at": "...",
    "created_by": "uuid"
  }
}
```

---

## PUT `/api/supplier/profile`

Creates or updates the caller's supplier profile as a draft. Permitted only
while `approval_status` is `draft` or `revisions_requested`. Any other status
returns `409`.

### Auth

`supplier_admin`

### Request body

All fields optional; unspecified fields are left unchanged.

```json
{
  "company_summary": "string | null",
  "facility_size_sqft": 0,
  "employee_count": 0,
  "quality_system_notes": "string | null",
  "capacity_notes": "string | null",
  "as9100_certified": false,
  "iso9001_certified": false,
  "itar_registered": false,
  "cmmc_status": "none | level_1 | level_2 | level_3"
}
```

### Response

`{ "profile": SupplierProfile }`

### Errors

- `400` — request body fails schema validation
- `403` — caller is not `supplier_admin`
- `409` — profile is in a non-editable status

---

## POST `/api/supplier/profile/submit`

Transitions the caller's profile from `draft` or `revisions_requested` to
`submitted`. Sets `submitted_at` to now.

### Auth

`supplier_admin`

### Audit

Writes `supplier_profile.submitted` with
`metadata.previous_status`.

### Response

`{ "profile": SupplierProfile }`

### Errors

- `404` — no profile exists for the organization
- `409` — current status does not allow submission

---

# 4. Admin Supplier Review Endpoints

## GET `/api/admin/supplier-profiles`

Lists supplier profiles by status. Defaults to `submitted,under_review`.

### Auth

`asgard_admin`

### Query params

- `status` — optional comma-separated list of approval statuses

### Response

`{ "profiles": SupplierProfile[] }`

---

## GET `/api/admin/supplier-profiles/[id]`

Returns a single supplier profile by id.

### Auth

`asgard_admin`

### Response

`{ "profile": SupplierProfile }` or `404`.

---

## POST `/api/admin/supplier-profiles/[id]/approve`

Transitions `submitted | under_review → approved`. Sets `reviewed_at`,
`reviewed_by`, and (optionally) `review_notes`.

### Auth

`asgard_admin`

### Request body

```json
{ "review_notes": "string (optional)" }
```

### Audit

`supplier_profile.approved` with metadata `previous_status`,
`supplier_organization_id`, `review_notes`.

### Errors

- `404` — profile not found
- `409` — current status does not allow approval

---

## POST `/api/admin/supplier-profiles/[id]/reject`

Transitions `submitted | under_review → rejected`. Same request shape and
metadata as approve.

### Audit

`supplier_profile.rejected`

---

## POST `/api/admin/supplier-profiles/[id]/request-revisions`

Transitions `submitted | under_review → revisions_requested`. Same request
shape and metadata as approve. After this, the supplier may edit and resubmit.

### Audit

`supplier_profile.revisions_requested`

---

# 5. Buyer RFQ Intake Endpoints

Implemented by task 02. All routes enforce `buyer_organization_id =
session.organization_id` in the handler and via RLS.

## GET `/api/buyer/programs`
List the caller's org's programs. Auth: `buyer_admin`, `buyer_user`.
Response: `{ "programs": Program[] }`.

## POST `/api/buyer/programs`
Create a program. Auth: `buyer_admin`, `buyer_user`. Body:
`{ program_name, program_type?, description?, compliance_level?,
itar_controlled?, cui_controlled? }`.
Audit: `program.created`.
Response: `{ "program": Program }`, status 201.

## GET `/api/buyer/programs/[id]`
Single program plus its RFQs. Returns 403 if cross-org.

## POST `/api/buyer/programs/[id]/rfqs`
Create an RFQ under a program. Body: `{ rfq_title, description?, quantity?,
required_delivery_date?, priority? }`.
Audit: `rfq.created`. Response: `{ "rfq": Rfq }`, status 201.

## GET `/api/buyer/rfqs`
List the caller's org's RFQs across all their programs.

## GET `/api/buyer/rfqs/[id]`
Single RFQ plus its parts.

## PUT `/api/buyer/rfqs/[id]`
Update an RFQ. Only while status is `draft`. Body: any subset of creation
fields.

## POST `/api/buyer/rfqs/[id]/parts`
Add a part to a draft RFQ. Body: `{ part_number, part_name?, revision?,
material?, process_required?, quantity?, tolerance_notes?,
finish_requirements?, inspection_requirements? }`.
Response: `{ "part": Part }`, status 201.

## DELETE `/api/buyer/rfqs/[id]/parts/[partId]`
Remove a part from a draft RFQ.

## POST `/api/buyer/rfqs/[id]/submit`
Transitions `draft → submitted`. Requires at least one part.
Audit: `rfq.submitted`.

## GET `/api/admin/rfqs` (task 02)
Admin list of RFQs filtered by status (defaults `submitted`).

## GET `/api/admin/rfqs/[id]` (task 02)
Admin single-RFQ view including parts.

---

# 6. Admin Routing Console Endpoints

Implemented by task 03. All routes require `asgard_admin`.

## GET `/api/admin/routing/queue`
RFQs in `submitted` or `routing_in_progress`, ordered by submission time.

## POST `/api/admin/rfqs/[id]/work-packages`
Create a work package under an RFQ. On first package, transitions the
parent RFQ `submitted → routing_in_progress`. Body:
`{ package_name, package_type?, description? }`.
Audit: `work_package.created` (metadata includes
`rfq_status_after: routing_in_progress`).

## GET `/api/admin/work-packages/[id]`
Returns `{ work_package, parts, routing_decisions }`.

## POST `/api/admin/work-packages/[id]/parts`
Attach a part to a work package. Body: `{ part_id }`. Enforces that the
part belongs to the same RFQ as the work package.

## DELETE `/api/admin/work-packages/[id]/parts/[partId]`
Detach a part from a work package.

## GET `/api/admin/work-packages/[id]/candidates`
Lists approved supplier profiles as routing candidates.

## POST `/api/admin/work-packages/[id]/routing-decisions`
Record a routing decision. Body: `{ supplier_organization_id,
capability_fit_score?, capacity_fit_score?, compliance_fit_score?,
schedule_fit_score?, routing_rationale? }`. All scores 0–100. Verifies the
supplier has an approved profile.
Audit: `routing_decision.created`.

## POST `/api/admin/routing-decisions/[id]/request-quote`
Transitions `pending → quote_requested`, stamps `quote_requested_at`. On
first request within an RFQ, transitions RFQ
`routing_in_progress → quotes_requested`.
Audit: `routing_decision.quote_requested`.

## GET `/api/supplier/quote-requests`
Supplier inbox — routing decisions assigned to the caller with status
`quote_requested`. Response is projected to exclude rationale and any
competitor data. Auth: `supplier_admin`, `supplier_user`.

---

# 7. Supplier Quote Workflow Endpoints

Implemented by task 04. Supplier routes resolve
`supplier_organization_id` from the session; admin routes require
`asgard_admin`.

## GET `/api/supplier/quotes`
Unified inbox: open quote requests plus any quote rows already submitted
or declined by the caller.

## GET `/api/supplier/quote-requests/[rdId]/quote`
Returns the caller's existing quote for this routing decision (or `null`).

## POST `/api/supplier/quote-requests/[rdId]/submit-quote`
Creates a quote in `submitted` status. Body: `{ quoted_price?,
lead_time_days?, minimum_order_quantity?, quote_notes? }`.
`quoted_price` accepts number or string decimal (max 2 dp).
Audit: `quote.submitted`.

## POST `/api/supplier/quote-requests/[rdId]/decline`
Creates a quote in `declined` status. Body: `{ quote_notes? }`.
Audit: `quote.declined`.

## GET `/api/admin/quotes`
List quotes filtered by status (default `submitted,under_review`).

## GET `/api/admin/quotes/[id]`
Admin single-quote view with work package, parts, and supplier org.

## POST `/api/admin/quotes/[id]/accept`
`submitted | under_review → accepted`. Atomically inserts a
`jobs` row with `status = awarded` and inherits the RFQ's
`required_delivery_date` as `due_date`. Body: `{ review_notes? }`.
Audit: `quote.accepted` **and** `job.created`.
Response: `{ quote, job }`.

## POST `/api/admin/quotes/[id]/reject`
`submitted | under_review → rejected`. Body: `{ review_notes? }`.
Audit: `quote.rejected`.

---

# 8. Job Execution Tracking Endpoints

Implemented by task 05.

## GET `/api/supplier/jobs`
List jobs assigned to the caller's supplier org.

## GET `/api/supplier/jobs/[id]`
Single job, own-org only (404 on cross-org).

## POST `/api/supplier/jobs/[id]/status`
Forward-only supplier transition:
`awarded → scheduled → in_production → inspection → shipped → complete`.
Body: `{ status, note? }`. Side effects: stamps `start_date` on first entry
into `in_production`; stamps `completed_date` on entry to `complete`.
Audit: `job.status_updated`.

## POST `/api/supplier/jobs/[id]/flag-issue`
Writes `last_issue_note` and `last_issue_flagged_at`. Body: `{ note }`
(required).
Audit: `job.issue_flagged`.

## GET `/api/admin/jobs`
All jobs.

## GET `/api/admin/jobs/[id]`
Admin single-job view.

## POST `/api/admin/jobs/[id]/status`
Admin override — any-to-any transition permitted, logged distinctly from
supplier updates. Body: `{ status, note? }`.
Audit: `job.status_overridden`.

## POST `/api/admin/jobs/[id]/flag-issue`
Admin risk flag. Same shape and audit action (`job.issue_flagged`) as the
supplier endpoint.

## GET `/api/buyer/jobs`
Jobs tied to the caller's programs (join: jobs → work_packages → rfqs →
programs where `buyer_organization_id = session.organization_id`).
Read-only.

---

# 9. Conventions

- Request and response bodies are JSON with `content-type: application/json`.
- All error responses use the shape `{ "error": "message" }`.
- Dates are ISO 8601 strings in UTC; date-only fields use `YYYY-MM-DD`.
- `organization_id` is never accepted in a request body. It is resolved from
  the authenticated session and applied server-side.
- `role` checks happen in the API handler before any data access. RLS policies
  on the database enforce the same rules as defense-in-depth.
- Every state-changing endpoint writes exactly one audit log row per primary
  state change. The `accept` endpoint is the one exception — it writes both
  `quote.accepted` and `job.created` because accepting a quote atomically
  creates a job.