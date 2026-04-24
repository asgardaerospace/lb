# Launchbelt Workflows

## Purpose

This document defines the operational workflows that govern execution inside Launchbelt.

These workflows translate aerospace manufacturing processes into structured, auditable system behavior.

They must support:

- Multi-node production  
- Compliance continuity  
- Human-in-loop validation  
- Program-level execution control  

---

# 1. Workflow Principles

## 1.1 Human-in-Loop First

Critical decisions require human validation:

- Routing  
- Supplier selection  
- Compliance approval  

Automation follows validated workflows.

---

## 1.2 Program-Level Execution

Launchbelt operates at:

- Assembly level  
- Multi-part coordination  
- Cross-supplier orchestration  

---

## 1.3 Compliance Continuity

Every workflow must preserve:

- Documentation chain  
- Inspection records  
- Certification context  

---

## 1.4 Auditability

Each workflow step must:

- Record state transitions  
- Log user actions  
- Maintain historical trace  

---

# 2. Supplier Onboarding Workflow

## Objective

Qualify and integrate a supplier into the network.

### Step 1: Registration
Actor: Supplier Admin

- Create organization  
- Create user account  
- Initialize supplier profile  

---

### Step 2: Profile Completion
Actor: Supplier

- Add machines  
- Add capabilities  
- Upload certifications  
- Provide facility data  

---

### Step 3: Submission
Actor: Supplier

System:
- approval_status → submitted  

---

### Step 4: Review
Actor: Admin / Quality

- Validate certifications  
- Assess capabilities  
- Request revisions  

---

### Step 5: Decision
Actor: Asgard Admin

One of:

- Approve → `approved` (terminal). Supplier is activated and eligible for routing.
- Reject → `rejected` (terminal). Supplier is not eligible; a new profile must
  be initiated to re-enter the pipeline.
- Request revisions → `revisions_requested`. Supplier Admin edits and
  resubmits, returning to Step 3.

All three outcomes require an audit log entry. `review_notes` may be supplied
by the reviewer and is stored on the profile plus in the audit log metadata.

---

# 3. OEM Program Workflow

## Objective

Define production demand.

### Step 1: Program Creation
Actor: Buyer

- Create program  
- Define compliance requirements  

---

### Step 2: RFQ Creation
Actor: Buyer

- Define quantity  
- Set timelines  
- Add requirements  

---

### Step 3: Part Upload
Actor: Buyer

- Upload CAD  
- Upload drawings  
- Define materials and tolerances  

---

### Step 4: Submission
Actor: Buyer

System:
- RFQ enters routing pipeline  

---

# 4. Assembly Decomposition Workflow

## Objective

Convert RFQ into manufacturable units.

### Step 1: Review
Actor: Deployment Engineer

- Validate parts  
- Confirm requirements  

---

### Step 2: Decomposition

- Break into subcomponents  
- Identify required processes  

---

### Step 3: Work Package Creation

- Create work packages  
- Link parts  

---

# 5. Routing Workflow

## Objective

Assign suppliers to work packages.

### Step 1: Candidate Identification

System filters by:

- Capability  
- Material  
- Certification  
- Capacity  

---

### Step 2: Evaluation
Actor: Deployment Engineer

- Capability fit  
- Capacity availability  
- Compliance readiness  
- Schedule alignment  

---

### Step 3: Routing Decision

- Create routing_decisions  
- Store rationale  

---

### Step 4: Supplier Selection

- Select suppliers  

---

### Step 5: Quote Request

- Notify suppliers  
- Initiate quote workflow  

---

# 6. Supplier Quoting Workflow

## Objective

Collect pricing and timelines.

### Step 1: RFQ Receipt
Actor: Supplier

- View RFQ  

---

### Step 2: Quote Submission

- Submit price  
- Submit lead time  
- Add notes  

---

### Step 3: Review
Actor: Admin

- Compare quotes  
- Evaluate tradeoffs  

---

### Step 4: Selection

- Accept selected quote  
- Reject others  

---

# 7. Job Execution Workflow

## Objective

Execute production.

### Step 1: Job Creation

- Create job  
- Assign supplier  

---

### Step 2: Scheduling
Actor: Supplier

- Confirm timeline  
- Allocate resources  

---

### Step 3: Production

- Manufacture parts  
- Update job status  

---

### Step 4: Progress Tracking

- Track status  
- Log updates  

---

# 8. Digital Traveler Workflow (Phase 2+)

## Objective

Maintain production traceability.

### Step 1: Traveler Creation

- Create digital traveler  

---

### Step 2: Define Steps

- Add process steps  
- Define inspection points  

---

### Step 3: Execution
Actor: Supplier

- Complete steps  
- Upload records  

---

### Step 4: Inspection
Actor: Quality

- Validate steps  
- Record results  

---

# 9. Compliance Workflow

## Objective

Ensure audit readiness.

### Step 1: Document Upload

- Buyer, Supplier, Admin upload documents  

---

### Step 2: Linking

Documents attached to:

- Parts  
- Jobs  
- Certifications  

---

### Step 3: Validation
Actor: Quality

- Review compliance  
- Verify requirements  

---

### Step 4: Approval

- Mark compliant  

---

# 10. Program Monitoring Workflow

## Objective

Provide execution visibility.

### Step 1: Data Aggregation

- RFQ status  
- Job status  
- Supplier performance  

---

### Step 2: Dashboard

- Progress  
- Bottlenecks  
- Risks  

---

### Step 3: Intervention
Actor: Admin

- Re-route work  
- Resolve delays  

---

# 11. Exception Handling

## Objective

Maintain execution continuity.

### Scenarios

- Supplier rejection  
- Production delay  
- Quality failure  
- Missing documentation  

---

### Actions

- Flag issue  
- Notify admin  
- Reassign supplier  
- Adjust schedule  

---

# 12. State Transitions

## RFQ

Implemented slice (tasks 02 + 03):

```text
draft ──► submitted ──► routing_in_progress ──► quotes_requested
```

Transitions driven by:

- `draft → submitted`                     — buyer submits RFQ (task 02)
- `submitted → routing_in_progress`       — admin creates first work package (task 03)
- `routing_in_progress → quotes_requested` — admin requests first quote (task 03)

`awarded` and `closed` states from the original roadmap are **not yet
implemented**. Today the RFQ stays in `quotes_requested` after a job is
created. Closing the loop (quote-accept → `awarded`; final job complete →
`closed`) is deferred to a later task.

## Part

Part-level lifecycle (`draft → routed → in_production → complete`) is **not
implemented**. Parts are plain rows on an RFQ; movement through the system
is tracked at the work-package and job level. A later task should either
add a `status` column to `parts` or remove this chain from the doc.

## Work Package

```text
open ──► routed
```

`open` on creation; `routed` is reserved for the future "all candidate
decisions resolved" transition. Not actively toggled in task 03.

## Routing Decision

```text
pending ──► quote_requested
```

`pending` on creation (task 03). Admin moves to `quote_requested` when
issuing the quote request to the supplier. No further states yet;
award/decline handling lives on the adjacent `quotes` row today.

## Quote

```text
draft ──► submitted ──► under_review ──► accepted
                    │                │
                    │                └──► rejected      (admin terminal)
                    │
                    └──► declined                       (supplier terminal)
```

Allowed transitions (enforced server-side by task 04):

- `draft → submitted`                    (supplier submits)
- `draft → declined`                     (supplier declines)
- `submitted → under_review`             (admin triage; currently not exposed in UI)
- `submitted → accepted | rejected`      (admin decision)
- `under_review → accepted | rejected`   (admin decision)

`accepted` atomically creates a matching `jobs` row with status `awarded`.
`accepted`, `rejected`, and `declined` are terminal.

## Job

Implemented chain (task 04 + task 05):

```text
awarded ──► scheduled ──► in_production ──► inspection ──► shipped ──► complete
```

Supplier transitions are forward-only; admin override (task 05) may move a
job to any state, logged as `job.status_overridden`. `start_date` is
stamped on entry to `in_production`; `completed_date` is stamped on entry
to `complete`.

## Supplier Profile

```text
draft ──► submitted ──► under_review ──► approved
                    │                │
                    │                ├──► rejected         (terminal)
                    │                │
                    └────────────────┴──► revisions_requested ──► draft
```

Allowed transitions (enforced server-side):

- `draft → submitted` (actor: supplier_admin)
- `submitted → under_review` (actor: asgard_admin, optional staging step)
- `submitted → approved | rejected | revisions_requested` (actor: asgard_admin)
- `under_review → approved | rejected | revisions_requested` (actor: asgard_admin)
- `revisions_requested → submitted` (actor: supplier_admin, after editing)

`approved` and `rejected` are terminal. Editing is permitted only while the
profile is in `draft` or `revisions_requested`. Every transition out of
`submitted` or `under_review` writes an audit log entry with the
`previous_status` captured in `metadata`.

---

# 13. Claude Instructions

- Enforce state transitions  
- Do not skip workflow steps  
- Log all actions  
- Separate workflows by role  
- Support multi-node execution  

---

# 14. Strategic Alignment

These workflows enable:

- Distributed production coordination  
- Embedded compliance  
- Controlled execution  
- Scalable infrastructure  

The platform governs execution. Users operate within defined workflows.