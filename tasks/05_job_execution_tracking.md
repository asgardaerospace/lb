
---

## `/tasks/05_job_execution_tracking.md`

```markdown
# Task 05: Job Execution Tracking

## Objective

Build the basic job execution tracking workflow.

Suppliers must be able to update job status. Admin and Buyer must be able to monitor progress based on their permissions.

---

## Scope

Implement:

- Job list
- Job detail view
- Status update controls
- Admin job oversight
- Buyer job progress visibility

---

## User Roles

### Supplier

Can:

- View own assigned jobs
- Update job status
- Upload job documents placeholder
- Flag issues

### Asgard Admin

Can:

- View all jobs
- Override status
- Flag risk
- Reassign work later

### Buyer

Can:

- View status of jobs tied to own programs
- Download approved documents later

---

## Required Data Entities

Use:

- jobs
- work_packages
- rfqs
- programs
- documents
- audit_logs

---

## Job Fields

MVP fields:

- job_number
- work_package_id
- supplier_organization_id
- status
- start_date
- due_date
- completed_date

---

## State Transitions

Job:

```text
awarded → scheduled → in_production → inspection → shipped → complete