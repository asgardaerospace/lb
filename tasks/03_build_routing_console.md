
---

## `/tasks/03_build_routing_console.md`

```markdown
# Task 03: Build Routing Console

## Objective

Build the Admin routing console for human-in-loop supplier selection.

Admins and deployment engineers must be able to review submitted RFQs, create work packages, view candidate suppliers, and record routing decisions.

---

## Scope

Implement:

- Submitted RFQ list
- RFQ detail review
- Work package creation
- Candidate supplier list
- Routing decision form
- Request quote action

---

## User Roles

### Asgard Admin / Deployment Engineer

Can:

- View all submitted RFQs
- Create work packages
- View supplier capabilities
- Select candidate suppliers
- Record routing rationale
- Request quotes

### Supplier

Can:

- Receive quote requests after routing only

### Buyer

Can:

- View status only
- Cannot route work

---

## Required Data Entities

Use:

- rfqs
- parts
- work_packages
- work_package_parts
- supplier_profiles
- machines
- capabilities
- routing_decisions
- audit_logs

---

## Routing Decision Fields

MVP fields:

- work_package_id
- supplier_organization_id
- capability_fit_score
- capacity_fit_score
- compliance_fit_score
- schedule_fit_score
- routing_rationale
- routing_status

---

## State Transitions

RFQ:

```text
submitted → routing_in_progress → quotes_requested