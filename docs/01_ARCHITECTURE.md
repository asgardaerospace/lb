# Launchbelt System Architecture

## Purpose

This document defines how Launchbelt is built and how its components interact.

It translates system intent into a deployable architecture that supports:

- Secure aerospace workflows  
- Multi-tenant isolation  
- Compliance enforcement  
- Human-in-loop execution  
- Scalable evolution  

---

# 1. High-Level Architecture

Launchbelt is a modular full-stack platform composed of:

1. Frontend Application  
2. Backend/API Layer  
3. Database Layer  
4. File Storage System  
5. Authentication and Authorization  
6. Audit and Logging  

---

## 1.1 Architecture Overview

Frontend (Next.js)  
↓  
API Layer (Server Functions)  
↓  
Application Logic  
↓  
Postgres Database (Supabase)  
↓  
File Storage (Secure Buckets)  

Auth and RLS enforced across all layers

---

# 2. Core Components

## 2.1 Frontend

Stack:
- Next.js  
- TypeScript  
- Tailwind CSS  
- shadcn/ui  

Responsibilities:
- Role-based dashboards  
- Forms and workflows  
- Data visualization  
- File uploads  

Constraint:
- No business logic in frontend  
- All validation handled in backend  

---

## 2.2 Backend / API Layer

Stack:
- Supabase  
- Next.js server routes  

Responsibilities:
- API endpoints  
- Workflow execution  
- Validation  
- Access control enforcement  

---

## 2.3 Database Layer

Stack:
- PostgreSQL (Supabase)

Responsibilities:
- Store all structured data  
- Enforce relationships  
- Support queries  
- Maintain integrity  

---

## 2.4 File Storage

Stack:
- Supabase Storage or S3

Responsibilities:
- Store CAD, drawings, certifications, reports  

Requirements:
- Private storage  
- Signed URL access  
- Metadata stored in database  

---

## 2.5 Authentication

Stack:
- Supabase Auth  

Responsibilities:
- User authentication  
- Session management  
- Role assignment  

---

## 2.6 Authorization

Enforced via:
- Role-based access control  
- Row-Level Security  

Rules:
- All data scoped by organization_id  
- Role determines access  

---

## 2.7 Audit System

Responsibilities:
- Track all critical actions  
- Store before/after states  
- Support compliance audits  

---

# 3. Data Flow

## RFQ Flow

1. Buyer submits RFQ  
2. API validates input  
3. Data stored in database  
4. Audit log created  

---

## Routing Flow

1. Admin evaluates suppliers  
2. System retrieves capabilities  
3. Admin selects supplier  
4. Routing decision recorded  

---

## Quote Flow

1. Supplier receives request  
2. Supplier submits quote  
3. Admin reviews  
4. Job created  

---

## Job Flow

1. Job assigned  
2. Supplier executes  
3. Status updates recorded  

---

# 4. Security Architecture

## Multi-Tenant Isolation

- Enforce organization-level data separation  
- Apply RLS to all queries  

---

## ITAR and CUI

- Restrict sensitive data access  
- Log access events  
- Segment storage  

---

## Document Security

- Private storage  
- Signed URLs  
- Controlled access  

---

# 5. Application Layers

Presentation Layer:
- UI and dashboards  

Application Layer:
- Business logic and workflows  

Data Layer:
- Database operations  

Infrastructure Layer:
- Hosting, auth, storage  

---

# 6. Deployment

Environment:
- Dev  
- Staging  
- Production  

Stack:
- Vercel (frontend + API)  
- Supabase (DB + Auth + Storage)  

---

# 7. Scaling Strategy

Phase 1:
- Manual routing  
- Core workflows  

Phase 2:
- Assisted routing  
- Increased volume  

Phase 3:
- Compliance automation  
- Digital travelers  

Phase 4:
- Predictive routing  
- Machine integration  

---

# 8. Constraints

System must:

- Enforce compliance  
- Maintain auditability  
- Preserve data integrity  
- Support distributed execution  

---

# 9. Claude Instructions

- Do not move logic to frontend  
- Enforce RLS  
- Keep services modular  
- Do not expose sensitive data  

---

# 10. Strategic Alignment

Architecture supports:

- Distributed manufacturing coordination  
- Compliance-first execution  
- Controlled scaling  