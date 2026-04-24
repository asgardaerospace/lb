
---

## `/tasks/02_create_rfq_flow.md`

```markdown
# Task 02: Create RFQ Flow

## Objective

Build the OEM RFQ intake workflow.

Buyers must be able to create a program, create an RFQ, add parts, upload documents, and submit the RFQ for routing.

---

## Scope

Implement:

- Program creation
- RFQ creation
- Part entry
- Document upload placeholder
- Submit RFQ action
- Buyer RFQ dashboard

---

## User Roles

### Buyer Admin / Buyer User

Can:

- Create programs
- Create RFQs
- Add parts
- Upload documents
- Submit RFQs
- View own RFQs

### Asgard Admin

Can:

- View all submitted RFQs
- Prepare RFQs for routing

---

## Required Data Entities

Use:

- organizations
- users
- programs
- rfqs
- parts
- documents
- audit_logs

Do not invent new core entities.

---

## Program Fields

MVP fields:

- program_name
- program_type
- description
- compliance_level
- itar_controlled
- cui_controlled

---

## RFQ Fields

MVP fields:

- rfq_title
- description
- quantity
- required_delivery_date
- priority

---

## Part Fields

MVP fields:

- part_number
- part_name
- revision
- material
- process_required
- quantity
- tolerance_notes
- finish_requirements
- inspection_requirements

---

## State Transitions

RFQ:

```text
draft → submitted → routing_in_progress