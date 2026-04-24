# Launchbelt UI Screens

## Purpose

This document defines all core UI screens in Launchbelt.

It translates workflows and user roles into:

- Concrete interfaces  
- Required data  
- User actions  
- System behavior  

This document is the **bridge between product design and implementation**.

Claude uses this to build frontend components.

---

# 1. Design Principles

## 1.1 Role-Based Interfaces

Each screen is tied to a specific user role:

- Admin  
- Supplier  
- OEM (Buyer)  

No shared dashboards across roles.

---

## 1.2 Workflow-Driven UI

Screens must reflect real workflows:

- RFQ → Routing → Quote → Job  
- Supplier → Execution → Compliance  

---

## 1.3 Minimal UI, Maximum Clarity

- No unnecessary dashboards  
- No generic SaaS patterns  
- Focus on execution and visibility  

---

# 2. Admin Screens

---

## 2.1 Admin Dashboard

**User:** Admin

### Purpose
System-wide visibility

### Displays
- Active programs  
- RFQs in progress  
- Jobs in production  
- Supplier performance summary  

### Actions
- Navigate to routing console  
- View program details  
- Access supplier approvals  

---

## 2.2 Supplier Approval Queue

**User:** Admin

### Purpose
Approve or reject supplier onboarding

### Displays
- Supplier name  
- Certifications  
- Capabilities  
- Submission status  

### Actions
- Approve supplier  
- Reject supplier  
- Request revisions  

---

## 2.3 Routing Console

**User:** Admin / Deployment Engineer

### Purpose
Assign suppliers to work packages

### Displays
- Work package details  
- Parts and requirements  
- Candidate suppliers  
- Capability match indicators  

### Actions
- Select supplier  
- Add routing rationale  
- Request quotes  

---

## 2.4 Program Oversight Dashboard

**User:** Admin

### Purpose
Monitor execution across programs

### Displays
- Program status  
- Job progress  
- Bottlenecks  
- Delivery risk  

### Actions
- Drill into jobs  
- Re-route work  
- Flag issues  

---

## 2.5 Compliance Panel

**User:** Admin / Quality

### Purpose
Validate compliance and documentation

### Displays
- Certifications  
- Inspection records  
- Compliance status  

### Actions
- Approve documents  
- Flag issues  
- Request additional data  

---

# 3. Supplier Screens

---

## 3.1 Supplier Dashboard

**User:** Supplier

### Purpose
Operational overview

### Displays
- Active jobs  
- Pending RFQs  
- Capacity utilization  

### Actions
- Open RFQs  
- Update capacity  
- View job details  

---

## 3.2 RFQ Inbox

**User:** Supplier

### Purpose
Respond to quote requests

### Displays
- Work package details  
- Part requirements  
- Quantity and timeline  

### Actions
- Submit quote  
- Decline RFQ  

---

## 3.3 Quote Submission Screen

**User:** Supplier

### Purpose
Provide pricing and lead time

### Inputs
- Price  
- Lead time  
- Minimum order quantity  
- Notes  

### Actions
- Submit quote  

---

## 3.4 Job Execution Panel

**User:** Supplier

### Purpose
Execute assigned work

### Displays
- Job details  
- Work instructions  
- Status  

### Actions
- Update job status  
- Upload documents  
- Flag issues  

---

## 3.5 Capacity Management

**User:** Supplier

### Purpose
Maintain availability

### Displays
- Machine availability  
- Weekly capacity  

### Actions
- Update capacity  
- Adjust availability  

---

## 3.6 Supplier Profile Management

**User:** Supplier Admin

### Purpose
Maintain company profile

### Displays
- Certifications  
- Machines  
- Capabilities  

### Actions
- Edit profile  
- Upload certifications  
- Submit updates  

---

# 4. OEM (Buyer) Screens

---

## 4.1 OEM Dashboard

**User:** Buyer

### Purpose
Program overview

### Displays
- Active programs  
- RFQs  
- Production status  

### Actions
- Create new program  
- Submit RFQ  
- View progress  

---

## 4.2 Program Creation Screen

**User:** Buyer

### Purpose
Define new program

### Inputs
- Program name  
- Description  
- Compliance requirements  

### Actions
- Create program  

---

## 4.3 RFQ Submission Screen

**User:** Buyer

### Purpose
Submit production request

### Inputs
- Quantity  
- Timeline  
- Requirements  

### Actions
- Submit RFQ  

---

## 4.4 Part Upload Screen

**User:** Buyer

### Purpose
Upload part data

### Inputs
- CAD files  
- Drawings  
- Materials  
- Tolerances  

### Actions
- Upload files  
- Save parts  

---

## 4.5 Program Status Tracker

**User:** Buyer

### Purpose
Track execution

### Displays
- RFQ status  
- Job progress  
- Delivery timeline  

### Actions
- View details  
- Download documents  

---

## 4.6 Documentation Viewer

**User:** Buyer

### Purpose
Access compliance records

### Displays
- Certifications  
- Inspection reports  
- Traceability records  

### Actions
- Download documents  

---

# 5. Shared System Components

---

## 5.1 Navigation

- Role-based sidebar  
- Only show relevant modules  

---

## 5.2 Notifications

- RFQ received  
- Quote requested  
- Job updates  
- Compliance alerts  

---

## 5.3 File Upload Component

- Secure upload  
- Attach to entities  
- Metadata tracking  

---

# 6. UI State Rules

- All screens must reflect backend state  
- No local-only state for critical workflows  
- Status must match workflow definitions  

---

# 7. Claude Instructions

When building UI:

1. Map each screen to a role  
2. Use data model fields only  
3. Do not invent UI actions outside workflows  
4. Keep UI minimal and functional  
5. Enforce role visibility  

---

# 8. Strategic Alignment

These screens enable:

- Controlled execution  
- Clear separation of roles  
- Efficient workflow navigation  
- Scalable product development  

UI exists to support execution, not to impress visually.