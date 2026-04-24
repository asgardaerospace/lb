# Launchbelt User Groups

## Purpose

This document defines the core user groups within Launchbelt, their responsibilities, permissions, and interactions.

These roles drive:

- System design  
- Access control  
- Workflow behavior  
- UI structure  
- Data visibility  

Launchbelt is a multi-sided execution platform. Each group operates within a defined boundary.

---

# 1. Core User Groups

Launchbelt operates across three primary actors:

1. Asgard Admin  
2. Supplier (Manufacturing Partner)  
3. OEM / Aerospace Defense Company  

Each group interacts with a different layer of the system.

---

# 2. Asgard Admin  
## Platform Operator and Execution Authority

### Role Definition

Asgard Admin operates Launchbelt as industrial infrastructure.

They control:

- Routing decisions  
- Supplier qualification  
- Compliance enforcement  
- Program execution oversight  

This includes:

- Operations leadership  
- Deployment engineers  
- Quality and compliance personnel  

---

## Core Responsibilities

### 2.1 Supplier Network Management

- Approve or reject suppliers  
- Validate certifications  
- Maintain supplier profiles  
- Monitor performance  

---

### 2.2 Routing and Orchestration

- Decompose assemblies  
- Create work packages  
- Assign suppliers  
- Optimize for:
  - Capability  
  - Capacity  
  - Compliance  
  - Schedule  

---

### 2.3 Compliance Enforcement

- Validate documentation  
- Maintain traceability  
- Enforce inspection gates  
- Ensure audit readiness  

---

### 2.4 Program Oversight

- Monitor all active programs  
- Track production status  
- Resolve bottlenecks  
- Intervene in execution issues  

---

## Permissions

- Full system access  
- Read and write across all entities  
- Override routing decisions  
- Access all documents and audit logs  

---

## Key Interfaces

- Admin Dashboard  
- Supplier Approval Queue  
- Routing Console  
- Program Oversight Dashboard  
- Compliance Panel  

---

## Constraints

- Must enforce ITAR and CUI controls  
- Must maintain audit logs  
- Must preserve system integrity  

---

# 3. Supplier  
## Manufacturing Execution Node

### Role Definition

Suppliers are independent manufacturing companies integrated into Launchbelt.

They:

- Provide capabilities and capacity  
- Execute assigned work  
- Maintain certifications  

They operate as structured network nodes, not marketplace vendors.

---

## Core Responsibilities

### 3.1 Capability Management

- Maintain machine inventory  
- Define processes and materials  
- Update capacity availability  
- Upload certifications  

---

### 3.2 RFQ Participation

- Review assigned RFQs  
- Submit quotes  
- Accept or decline work  

---

### 3.3 Production Execution

- Manufacture assigned parts  
- Follow defined workflows  
- Update job status  

---

### 3.4 Compliance Participation

- Upload inspection data  
- Maintain documentation  
- Support audits  

---

## Permissions

- Access own organization data  
- Manage own profile, machines, capabilities  
- View assigned RFQs and jobs  
- Submit quotes  
- Upload documents  

---

## Restrictions

- Cannot view other suppliers  
- Cannot access full program architecture  
- Cannot modify routing logic  
- Cannot access system-wide data  

---

## Key Interfaces

- Supplier Dashboard  
- RFQ Inbox  
- Job Execution Panel  
- Capacity Management  
- Document Upload Interface  

---

## Performance Metrics

- On-time delivery  
- Quality yield  
- NCR rate  
- Quote responsiveness  
- Capacity utilization  

---

## Constraints

- Must maintain valid certifications  
- Must follow digital workflows  
- Must comply with assigned requirements  

---

# 4. OEM / Aerospace Company  
## Demand Originator

### Role Definition

OEM users define production demand and receive finished hardware.

They:

- Submit programs and RFQs  
- Define requirements  
- Track execution  

They do not manage suppliers directly.

---

## Core Responsibilities

### 4.1 Program Definition

- Upload assemblies  
- Define materials and tolerances  
- Specify compliance requirements  

---

### 4.2 RFQ Submission

- Submit production requests  
- Define quantities and timelines  

---

### 4.3 Program Monitoring

- Track status  
- Monitor progress  
- Review updates  

---

### 4.4 Compliance Consumption

- Access documentation  
- Review traceability  
- Use records for certification and contracts  

---

## Permissions

- Access own programs  
- Create and manage RFQs  
- View status dashboards  
- Download documentation  

---

## Restrictions

- Cannot modify routing logic  
- Cannot access other buyers  
- Limited visibility into supplier internals  
- Supplier identity visibility configurable  

---

## Key Interfaces

- OEM Dashboard  
- Program Creation Interface  
- RFQ Submission Form  
- Program Status Tracker  
- Documentation Viewer  

---

## Value Delivered

- Faster RFQ cycles  
- Reduced supply chain overhead  
- Preserved compliance continuity  
- Multi-node production without internal scaling  

---

## Constraints

- Must provide accurate requirements  
- Must operate within compliance frameworks  

---

# 5. Cross-Group Interaction Model

## Execution Flow

1. OEM submits RFQ  
2. Admin parses and routes  
3. Suppliers receive work  
4. Suppliers execute production  
5. Platform tracks and governs  
6. OEM receives deliverables  

---

## Control Principle

The platform governs execution.

Users do not coordinate production independently.

---

# 6. Access Control Model

## Enforcement Mechanisms

- Role-based access control  
- Row-level security  
- Organization scoping  
- Compliance-based restrictions  

---

## Data Visibility Rules

- All data scoped by organization_id  
- Cross-organization access restricted  
- Sensitive data controlled by role and compliance flags  

---

# 7. System Design Implications

## UI Design

Each role requires:

- Dedicated dashboards  
- Isolated workflows  
- Role-specific data views  

---

## Backend Design

- Enforce permissions at API level  
- Validate role before actions  
- Restrict queries by organization  

---

## Database Design

- Include organization_id in all sensitive tables  
- Enforce relational boundaries  
- Support role-based filtering  

---

# 8. Claude Code Instructions

When implementing features:

1. Always check user role  
2. Enforce organization boundaries  
3. Do not expose cross-role data  
4. Build features per role context  
5. Validate permissions before execution  

---

# 9. Strategic Alignment

This role structure supports:

- Controlled execution  
- Compliance enforcement  
- Scalable coordination  
- Clear separation of responsibilities  

Launchbelt operates as infrastructure, not a shared workspace.