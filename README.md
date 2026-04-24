# Launchbelt  
## Aerospace Manufacturing Orchestration Platform

Launchbelt is the execution layer that coordinates distributed aerospace manufacturing.

It enables:

- Assembly-level routing across multiple suppliers  
- Constraint-based production allocation  
- Compliance continuity across nodes  
- Digital traceability from RFQ to delivery  

This is not an RFQ marketplace.  
This is production infrastructure.

---

# System Overview

Launchbelt connects three core user groups:

1. Asgard Admin  
   Platform operator, routing authority, compliance enforcement  

2. Supplier (Manufacturing Partner)  
   Executes production, maintains capability and certifications  

3. OEM / Aerospace Company  
   Defines programs, submits RFQs, receives certified hardware  

The platform governs execution across all three.

---

# Core Capabilities

- Program and RFQ intake  
- Assembly decomposition into work packages  
- Human-in-loop routing  
- Supplier capability matching  
- Quote aggregation and selection  
- Job execution tracking  
- Digital traveler (phase 2)  
- Compliance and audit documentation  

---

# Repository Structure

/docs
  00_SYSTEM.md
  01_ARCHITECTURE.md
  02_DATA_MODEL.md
  03_USER_GROUPS.md
  04_WORKFLOWS.md
  05_UI_SCREENS.md (optional)
  06_CLAUDE_INSTRUCTIONS.md

/tasks
  create_supplier_profile.md
  create_rfq_flow.md
  routing_console_v1.md

/src
  (application code)

---

# How to Work With This System

## Step 1: Read Documentation

All development is governed by /docs.

Start with:

1. /docs/00_SYSTEM.md  
2. /docs/02_DATA_MODEL.md  
3. /docs/04_WORKFLOWS.md  

---

## Step 2: Execute Tasks

Development is task-based.

Example:

Read /docs.  
Execute /tasks/create_supplier_profile.md  

---

## Step 3: Build in Modules

Do not build the full platform at once.

Sequence:

1. Authentication and roles  
2. Supplier profiles  
3. RFQ intake  
4. Routing console  
5. Quotes and jobs  
6. Compliance layer  

---

# Development Principles

- Human-in-loop before automation  
- Compliance before scale  
- Program-level orchestration  
- Auditability at every step  
- Role-based access enforced everywhere  

---

# Tech Stack (Recommended)

- Frontend: Next.js  
- Backend: Supabase (Postgres + Auth + Storage)  
- ORM: Prisma  
- UI: Tailwind + shadcn  
- Deployment: Vercel  

---

# Security and Compliance

Launchbelt must support:

- AS9100-aligned workflows  
- ITAR-controlled data segmentation  
- CUI-safe environments  
- Full audit traceability  

All data must be:

- Organization-scoped  
- Role-restricted  
- Logged and traceable  

---

# Current Build Stage

Phase: Platform Activation  

Focus:

- Supplier onboarding  
- RFQ intake  
- Manual routing  
- Quote workflows  

Automation and digital travelers follow validation.

---

# Strategic Context

Launchbelt exists to solve:

- Fragmented manufacturing capacity  
- Broken compliance continuity  
- Slow RFQ cycles  
- Lack of production visibility  

The system coordinates distributed production under a unified execution model.

---

# Final Note

Launchbelt is built as infrastructure, not software.

Every feature must support:

- Real manufacturing workflows  
- Compliance enforcement  
- Multi-node execution  
- Scalable orchestration  

If it does not, it does not belong in the system.