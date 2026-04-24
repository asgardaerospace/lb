
---

## `/tasks/04_supplier_quote_submission.md`

```markdown
# Task 04: Supplier Quote Submission

## Objective

Build the supplier quote workflow.

Suppliers must be able to view assigned quote requests and submit price, lead time, and notes.

---

## Scope

Implement:

- Supplier RFQ inbox
- Quote request detail page
- Quote submission form
- Admin quote review list
- Accept/reject quote actions

---

## User Roles

### Supplier Admin / Supplier User

Can:

- View assigned quote requests
- Submit quotes
- Decline quote requests

### Asgard Admin

Can:

- View submitted quotes
- Accept quotes
- Reject quotes

---

## Required Data Entities

Use:

- routing_decisions
- work_packages
- quotes
- jobs
- audit_logs

---

## Quote Fields

MVP fields:

- work_package_id
- supplier_organization_id
- quoted_price
- lead_time_days
- minimum_order_quantity
- quote_notes
- status

---

## State Transitions

Quote:

```text
draft → submitted → under_review → accepted