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

Returns current user profile.

### Auth

All authenticated users

### Response

```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "email": "user@company.com",
  "role": "buyer_admin"
}