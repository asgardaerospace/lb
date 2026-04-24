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

# 5. Conventions

- Request and response bodies are JSON with `content-type: application/json`.
- All error responses use the shape `{ "error": "message" }`.
- Dates are ISO 8601 strings in UTC.
- `organization_id` is never accepted in a request body. It is resolved from
  the authenticated session and applied server-side.
- `role` checks happen in the API handler before any data access. RLS policies
  on the database enforce the same rules as defense-in-depth.