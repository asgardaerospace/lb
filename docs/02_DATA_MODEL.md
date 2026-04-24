# Launchbelt Data Model

## Purpose

This document defines what data exists in Launchbelt and how it is structured.

It is the single source of truth for:

- Entities  
- Fields  
- Relationships  

---

# 1. Core Principles

## Organization Scoped

All records must include:

organization_id

---

## Role-Based Access

Users belong to:

- Admin  
- Supplier  
- Buyer  

---

## Auditability

All tables include:

- created_at  
- updated_at  
- created_by  
- status  

---

# 2. Core Entities

## Organizations

Represents companies on the platform.

Fields:
- id  
- name  
- type (asgard, supplier, buyer)  
- itar_registered  
- created_at  

---

## Users

Represents system users.

Fields:
- id  
- organization_id  
- email  
- role  
- status  

---

## Supplier Profiles

Fields:
- id  
- organization_id  
- approval_status  
- certifications  
- capacity_notes  

---

## Certifications

Fields:
- id  
- organization_id  
- type  
- expiration_date  
- verification_status  

---

## Machines

Fields:
- id  
- organization_id  
- machine_type  
- materials_supported  
- capacity  

---

## Capabilities

Fields:
- id  
- organization_id  
- process_type  
- materials_supported  

---

## Programs

Fields:
- id  
- buyer_organization_id  
- name  
- compliance_level  
- status  

---

## RFQs

Fields:
- id  
- program_id  
- quantity  
- delivery_date  
- status  

---

## Parts

Fields:
- id  
- rfq_id  
- material  
- process_required  
- quantity  

---

## Work Packages

Fields:
- id  
- rfq_id  
- type  
- status  

---

## Routing Decisions

Fields:
- id  
- work_package_id  
- supplier_id  
- fit_scores  
- rationale  

---

## Quotes

Fields:
- id  
- supplier_id  
- price  
- lead_time  
- status  

---

## Jobs

Fields:
- id  
- supplier_id  
- work_package_id  
- status  
- due_date  

---

## Documents

Fields:
- id  
- organization_id  
- file_type  
- storage_path  
- compliance_flags  

---

## Audit Logs

Fields:
- id  
- user_id  
- action  
- entity_type  
- timestamp  

---

# 3. Relationships

- Organization → Users  
- Organization → Supplier Profile  
- Buyer → Programs  
- Program → RFQs  
- RFQ → Parts  
- Work Package → Parts  
- Work Package → Routing Decisions  
- Routing Decision → Supplier  
- Supplier → Quotes  
- Quote → Job  
- Job → Documents  

---

# 4. Access Rules

Admin:
- Full access  

Supplier:
- Own data only  

Buyer:
- Own programs only  

---

# 5. MVP Tables

Start with:

- organizations  
- users  
- supplier_profiles  
- programs  
- rfqs  
- parts  
- routing_decisions  
- quotes  
- jobs  
- documents  

---

# 6. Constraints

- All data must be scoped  
- Relationships must be enforced  
- No duplicate sources of truth  

---

# 7. Claude Instructions

- Do not invent fields  
- Do not modify schema without updating this doc  
- Enforce relationships  
- Maintain consistency  

---

# 8. Strategic Alignment

This data model enables:

- Routing orchestration  
- Supplier matching  
- Compliance tracking  
- Scalable production coordination  