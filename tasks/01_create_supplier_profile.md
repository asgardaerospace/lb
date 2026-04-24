# Task 01: Create Supplier Profile Module

## Objective

Build the supplier onboarding and profile management module.

Suppliers must be able to create, edit, save, and submit their manufacturing profile for Asgard review.

---

## Scope

Implement:

- Supplier profile form
- Save draft action
- Submit for review action
- Admin supplier review list
- Admin approve/reject actions

---

## User Roles

### Supplier Admin

Can:

- View own supplier profile
- Edit own supplier profile
- Save draft
- Submit for review

### Asgard Admin

Can:

- View submitted supplier profiles
- Approve supplier
- Reject supplier
- Request revisions

---

## Required Data Entities

Use:

- organizations
- users
- supplier_profiles
- certifications
- machines
- capabilities
- documents
- audit_logs

Do not invent new core entities.

---

## Supplier Profile Fields

MVP fields:

- company_summary
- facility_size_sqft
- employee_count
- quality_system_notes
- capacity_notes
- as9100_certified
- iso9001_certified
- itar_registered
- cmmc_status

---

## State Transitions

```text
draft → submitted → under_review → approved