# Software Requirements Specification (SRS)

**Project:** Chama Financial Ledger System (MERN Stack)
**Version:** 1.0
**Date:** November 16, 2026
**Standard:** IEEE 830-1998

## Revision History

| Version | Date       | Author           | Description                                                                 |
|---------|------------|------------------|-----------------------------------------------------------------------------|
| 1.0     | 2026-11-16 | System Architect | Initial formal SRS based on finalized Chama Ledger architecture and requirements. |

---

## 1. Introduction

### 1.1 Purpose

The purpose of this Software Requirements Specification (SRS) is to define the complete functional, non-functional, interface, and architectural requirements for the Chama Financial Ledger System. The intended audience includes software engineers, backend/frontend developers, QA testers, system architects, and Chama executive stakeholders (Treasurer, Secretary, Chairperson). This specification governs the full-stack MERN (MongoDB, Express.js, React, Node.js) implementation, covering authentication, transparent global read-only access, admin payment allocation, loan management, automated fine enforcement, and PDF statement reporting.

### 1.2 Scope

The Chama Financial Ledger System is a web-based financial management and accounting platform designed for informal cooperative savings groups (Chamas) operating in Kenya (denominated in Kenyan Shillings, KES).

**Core capabilities:** The software tracks mandatory monthly member shares/savings, supplementary monthly funds (Christmas, Retreat, Office, Sitting Allowance), tiered standard and emergency loan disbursements, bulk payment allocation by administrators, penalty assessment, and official PDF statement generation.

**Objectives & benefits:** Eliminate manual bookkeeping errors, establish an immutable audit trail using reversing entries rather than hard deletions, and promote group-wide accountability by granting all authenticated members global read-only visibility into group contributions and loan books while restricting write operations strictly to administrators.

### 1.3 Definitions, Acronyms, and Abbreviations

- **Chama:** An informal cooperative society or investment group used to pool savings and extend credit to members in East Africa.
- **Contra-Entry (Reversing Entry):** An accounting transaction posted to negate an erroneous entry while preserving the original record in the immutable audit trail.
- **Global Read Access:** A security model wherein any authenticated active member can view all group-wide contribution summaries, loan books, and transaction logs without mutation privileges.
- **JWT:** JSON Web Token, used for stateless API authentication.
- **KES:** Kenyan Shilling, the base currency of the ledger.
- **MERN:** MongoDB, Express.js, React, and Node.js technology stack.
- **MoSCoW:** Prioritization framework categorizing requirements as Must Have (M), Should Have (S), Could Have (C), or Won't Have (W).
- **RBAC:** Role-Based Access Control.
- **SRS:** Software Requirements Specification.

### 1.4 References

- IEEE Std 830-1998, *IEEE Recommended Practice for Software Requirements Specifications*.
- SRS Documentation Skill.md (Internal Specification Template, Version 1.0).
- Chama Ledger System Architecture & Blueprint (`system-architecture.md`, Revision 2026-11).

### 1.5 Overview

Section 2 provides an overall description of the product perspective, user classes, operating constraints, and system assumptions. Section 3 details specific external interfaces, numbered functional requirements (FR), performance benchmarks, design constraints, and software system attributes (NFR). Section 4 contains the Glossary, Analysis Models (Data Flow, Entity-Relationship, and State Diagrams), and the Requirements Traceability Matrix.

---

## 2. Overall Description

### 2.1 Product Perspective

The Chama Financial Ledger System operates as a standalone, decoupled client-server web application:

- **System Context:** Replaces physical ledger books and fragmented spreadsheets with a centralized, web-accessible financial source of truth.
- **System & Software Interfaces:** Built on Node.js (v18+) and Express.js for the RESTful API backend, MongoDB (v6+) with Mongoose ODM for persistent storage, and React with Tailwind CSS for the Single Page Application (SPA) frontend. Uses `pdfkit` on the server side to render downloadable PDF statements.
- **User Interfaces:** Responsive web interface accessible on desktop and mobile browsers, bifurcated into a Read-Only Transparency Portal (Members) and a Ledger Administration Console (Admins).
- **Communications Interfaces:** HTTPS/TLS 1.2+ over TCP/IP using JSON payloads (`application/json`) and `application/pdf` binary streams for statement exports.
- **Memory & Storage Constraints:** Database storage shall support atomic multi-document ACID transactions (requiring a MongoDB replica set configuration).
- **Operations & Site Adaptation:** Deployed via standard cloud PaaS/VPS environments with environment variables (`.env`) controlling database URIs, JWT secrets, and public signup flags.

### 2.2 Product Functions

- **Identity & Access Management:** JWT authentication, password hashing (bcrypt), immediate account suspension enforcement, and strict separation between Admin (Read/Write) and Member (Global Read-Only) roles.
- **Contribution & Bulk Payment Allocation:** Recording monthly member deposits and allowing administrators to manually split bulk payments across Shares/Savings, Christmas, Retreat, Office, Sitting Allowance, Loan Repayments, and Fines.
- **Loan Lifecycle Management:** Validation, approval, and disbursement of Standard Loans (≤ KES 200,000 for 6 months; > KES 200,000 for 12 months at 10% flat upfront interest) and Emergency Loans (2 months at 0% interest).
- **Due Date & Automated Penalty Engine:** Configurable monthly due dates and grace periods per billing cycle, triggering KES 500 late share fines and 20%-of-interest late loan fines.
- **Audit-Safe Ledger Corrections:** Soft-voiding and contra-entry reversals to maintain complete historical traceability.
- **Transparent Group Reporting & PDF Statements:** Real-time master contribution grids, public loan books, and downloadable member PDF statements.

### 2.3 User Characteristics

- **Chama Administrators (Treasurer / Secretary):** Moderate digital literacy; familiar with mobile money reconciliation (M-Pesa), bank statements, and basic accounting principles. Require clear validation feedback and atomic transaction forms.
- **General Chama Members:** Varying levels of technical proficiency; primarily access the system via mobile browsers or laptops to verify their deposits, inspect peer accountability metrics, and download personal statements.

### 2.4 Constraints

- **CON-REG-001:** All monetary figures shall be stored and calculated in Kenyan Shillings (KES) with exact decimal/integer precision to prevent floating-point rounding discrepancies.
- **CON-TECH-001:** The backend shall be implemented in Node.js/Express and MongoDB/Mongoose following an MVC + Service Layer architecture.
- **CON-TECH-002:** Hard deletion (DELETE operations removing documents from MongoDB) of financial transactions or disbursed loans is strictly prohibited.
- **CON-SEC-001:** Public self-registration shall be disabled by default (`ALLOW_PUBLIC_SIGNUP=false`), requiring administrators to onboard new members.

### 2.5 Assumptions and Dependencies

- **Database Replica Set:** MongoDB is deployed as a replica set (e.g., MongoDB Atlas) to support `session.startTransaction()` during multi-entry bulk payment allocations.
- **Manual Payment Verification:** External mobile money (M-Pesa) and bank transfers occur outside the system; administrators verify receipts manually before posting allocations.
- **Accurate System Clock:** The host server maintains synchronized UTC/EAT (UTC+3) time for accurate due-date and grace-period evaluations.

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces

- **UI-001 (Login Screen):** Clean authentication form accepting email and password, displaying generic error messages on failure.
- **UI-002 (Transparent Member Dashboard):** Displays group-wide summary cards (Total Chama Pool, Active Loans Disbursed, Total Fines Collected), a Master Contribution Matrix across all members, an Active Loan Book table, a personal transaction history tab, and a "Download PDF Statement" button. Write/edit action buttons shall not be rendered for member roles.
- **UI-003 (Admin Operations Console):** Includes all Member Dashboard views plus interactive modals/forms for Member Onboarding, Monthly Cycle Configuration (Due Dates/Grace Periods), Bulk Payment Allocation (split-line item allocator), Loan Disbursement, and Transaction Reversal/Voiding.

#### 3.1.2 Software & API Interfaces

- **API-001:** RESTful JSON endpoints under `/api/auth`, `/api/users`, `/api/loans`, `/api/transactions`, `/api/statements`, and `/api/config`.
- **API-002:** HTTP Bearer Token authentication header (`Authorization: Bearer <token>`) required on all protected routes.

### 3.2 Functional Requirements

#### 3.2.1 Authentication & Access Control (FR-AUTH)

| ID | Description | Priority | Status | Source |
|----|-------------|----------|--------|--------|
| FR-AUTH-001 | **User Login:** The system shall authenticate users via email and password, returning a signed JWT containing only the user's unique identifier upon valid credentials. *Inputs:* email, password. *Outputs:* HTTP 200 with JWT token and user profile; HTTP 401 with "Invalid email or password" on failure. | M | Approved | Security Design |
| FR-AUTH-002 | **Real-Time Status & Role Verification:** On every authenticated request, the system shall fetch the user's current role and status from MongoDB and reject requests with HTTP 403 if status is suspended or inactive. | M | Approved | Security Design |
| FR-AUTH-003 | **Global Read-Only Enforcement:** The system shall allow any active authenticated user (admin or member) to execute GET requests across group ledgers, loan books, and contribution tables, while blocking member accounts with HTTP 403 on all POST, PUT, PATCH, and DELETE requests. | M | Approved | Stakeholder Requirement |
| FR-AUTH-004 | **Admin Member Onboarding:** The system shall provide an admin-only endpoint (`POST /api/auth/register-member`) to create new member or admin accounts with bcrypt-hashed passwords (cost factor 12). | M | Approved | Security Design |
| FR-AUTH-005 | **Member Directory Projection:** When a member queries the user directory (`GET /api/users`), the system shall project only `fullName`, `phoneNumber`, `role`, `status`, and `joinedDate`, reserving full metadata for admin queries. | S | Approved | Transparency Policy |

#### 3.2.2 Contributions & Payment Allocation (FR-TXN)

| ID | Description | Priority | Status | Source |
|----|-------------|----------|--------|--------|
| FR-TXN-001 | **Monthly Contribution Categories:** The system shall track monthly member payments across five distinct contribution categories: `shares_savings` (mandatory variable/fixed monthly share), `christmas_contrib` (minimum KES 2,000 up to any desired amount), `retreat_contrib` (KES 3,000), `office_contrib` (KES 500), and `sitting_allowance` (KES 500). | M | Approved | Chama Bylaws |
| FR-TXN-002 | **Christmas Contribution Validation:** When recording a `christmas_contrib` transaction, the system shall validate that the allocated amount is ≥ KES 2,000 and reject lesser amounts with HTTP 400. | M | Approved | Chama Bylaws |
| FR-TXN-003 | **Atomic Bulk Payment Allocation:** The system shall allow an administrator to input a member's total deposit (with `paymentMethod`, `receiptNumber`, and `monthTarget` formatted as YYYY-MM) and allocate line-item amounts across multiple categories and/or active loans within a single atomic MongoDB ACID transaction. *Error handling:* If the sum of line items does not equal the total deposit, or if any database write fails, the entire session shall abort and roll back with HTTP 400/500. | M | Approved | Financial Architecture |
| FR-TXN-004 | **Immutable Audit Trail & Contra-Entries:** The system shall record the authorizing `adminId` on every transaction. Deleting or voiding a transaction (`DELETE /api/transactions/:id`) shall mark the record as voided and automatically generate a compensating contra-entry with a mandatory `remarks` reason rather than removing the document. | M | Approved | Audit Compliance |

#### 3.2.3 Loan Management (FR-LOAN)

| ID | Description | Priority | Status | Source |
|----|-------------|----------|--------|--------|
| FR-LOAN-001 | **Standard Loan Tier 1 (≤ KES 200,000):** For standard loans with `principalAmount` ≤ KES 200,000, the system shall apply a 10% flat upfront interest (`totalInterest = principalAmount * 0.10`), set `totalPayable = principalAmount + totalInterest`, and set `dueDate` to exactly 6 calendar months from `disbursedDate`. | M | Approved | Chama Bylaws |
| FR-LOAN-002 | **Standard Loan Tier 2 (> KES 200,000):** For standard loans with `principalAmount` > KES 200,000 (i.e., KES 200,001 and above), the system shall apply a 10% flat upfront interest (`totalInterest = principalAmount * 0.10`), set `totalPayable = principalAmount + totalInterest`, and set `dueDate` to exactly 12 calendar months (1 year) from `disbursedDate`. | M | Approved | Chama Bylaws |
| FR-LOAN-003 | **Emergency Loans:** For emergency loans, the system shall enforce a 0% interest rate (`interestRate = 0`, `totalInterest = 0`, `totalPayable = principalAmount`) and set `dueDate` to exactly 2 calendar months from `disbursedDate`. | M | Approved | Chama Bylaws |
| FR-LOAN-004 | **Loan Disbursement & Ledger Logging:** When an administrator disburses an approved loan, the system shall atomically update the loan status to `disbursed`, record `disbursedDate`, and post a corresponding disbursement entry in the ledger. | M | Approved | Financial Architecture |
| FR-LOAN-005 | **Loan Repayment & Automatic Clearance:** When an administrator allocates a `loan_repayment` transaction linked to a `referenceId` (Loan ID), the system shall increment `amountPaid` on the loan. Once `amountPaid >= totalPayable`, the system shall automatically transition the loan status to `cleared` and record `clearedDate`. *Error handling:* Reject allocations exceeding the remaining loan balance (`totalPayable - amountPaid`) with HTTP 400. | M | Approved | Financial Architecture |


#### 3.2.4 Due Dates & Automated Fines (FR-FINE)

| ID | Description | Priority | Status | Source |
|----|-------------|----------|--------|--------|
| FR-FINE-001 | **Billing Cycle Configuration:** The system shall provide an admin-only configuration interface (`POST /api/config`) to define `billingCycleMonth` (YYYY-MM), `sharesDueDate`, `sharesGracePeriodEndDate`, and `loanRepaymentDueDate`. | M | Approved | Stakeholder Clarification |
| FR-FINE-002 | **Late Shares Penalty Assessment:** When the current date exceeds `sharesGracePeriodEndDate` for an active billing cycle, the system shall assess a flat KES 500 `fine_late_shares` entry for any active member who has zero `shares_savings` transactions posted for that `monthTarget`. Duplicate fines for the same member and cycle shall be prevented via idempotency checks. | M | Approved | Chama Bylaws |
| FR-FINE-003 | **Late Loan Clearance Penalty Assessment:** When an active disbursed standard loan passes its `dueDate` without reaching `cleared` status, the system shall assess a `fine_late_loan` penalty equal to 20% of the loan's `totalInterest` (`fineAmount = totalInterest * 0.20`). | M | Approved | Chama Bylaws |

#### 3.2.5 Reporting & PDF Statements (FR-RPT)

| ID | Description | Priority | Status | Source |
|----|-------------|----------|--------|--------|
| FR-RPT-001 | **Master Contribution Table:** The system shall expose a read-only endpoint (`GET /api/statements/master`) aggregating every member's cumulative contributions by category, total loans taken, total loans repaid, and outstanding fines for a requested year or billing cycle. | M | Approved | Transparency Policy |
| FR-RPT-002 | **Individual Member Statement Data:** The system shall expose a read-only endpoint (`GET /api/statements/:userId`) returning a chronological ledger of all transactions, active/historical loans, and net balances for the specified member. | M | Approved | Stakeholder Requirement |
| FR-RPT-003 | **Downloadable PDF Statement:** The system shall provide an endpoint (`GET /api/statements/:userId/pdf`) that dynamically generates and streams a formatted PDF financial statement (`Content-Type: application/pdf`) containing Chama branding, generation timestamp, member details, summary balances, and itemized ledger entries. | M | Approved | Stakeholder Clarification |

### 3.3 Performance Requirements

- **NFR-PERF-001:** Standard API read requests (`GET /api/transactions`, `GET /api/loans`, `GET /api/statements/master`) shall respond within 500 milliseconds for datasets up to 50,000 transaction documents.
- **NFR-PERF-002:** Atomic bulk payment allocation requests (`POST /api/transactions/allocate`) shall complete within 1,000 milliseconds under normal load.
- **NFR-PERF-003:** Dynamic PDF statement generation (`GET /api/statements/:userId/pdf`) shall complete and initiate streaming within 3,000 milliseconds for up to 1,000 ledger line items.

### 3.4 Design Constraints

- **Architecture:** Backend shall strictly separate routing (`routes/`), HTTP handling (`controllers/`), business logic/calculations (`services/`), and database schemas (`models/`).
- **Validation:** All incoming request bodies and URL parameters shall be validated using schema-based middleware (zod or express-validator) prior to reaching controllers.
- **MongoDB Indexing:** Compound indexes shall be maintained on Transaction (`{ userId: 1, monthTarget: 1 }`, `{ type: 1, createdAt: -1 }`) and Loan (`{ userId: 1, status: 1 }`).

### 3.5 Software System Attributes

- **NFR-SEC-001 (Rate Limiting & Hardening):** Authentication endpoints (`/api/auth/*`) shall enforce rate limiting of maximum 20 requests per 15-minute window per IP address. HTTP headers shall be secured via helmet and strict CORS policies.
- **NFR-REL-001 (ACID Atomicity):** Multi-document updates (payment allocations, loan repayments updating loan balances, and reversing contra-entries) shall utilize MongoDB `ClientSession` transactions so partial writes never occur on failure.
- **NFR-USA-001 (Responsive Layout):** All frontend ledger tables shall support horizontal scrolling and mobile-friendly summary cards on viewports as narrow as 360px.
- **NFR-MAINT-001 (Automated Test Coverage):** RBAC rules (`enforceReadOnlyForMembers`), loan tier calculations, and fine formulas shall be covered by automated integration tests (Jest + Supertest).

### 3.6 Other Requirements

- **Database Backups:** Automated daily snapshots of the MongoDB cluster shall be configured in production to guarantee point-in-time recovery.
- **Timezone & Currency Formatting:** All UI displays and PDF statements shall format currency as `KES X,XXX.XX` and dates in East Africa Time (Africa/Nairobi, UTC+3).

---

## 4. Appendices

### Appendix A: Glossary

- **Billing Cycle (`monthTarget`):** A calendar month formatted as YYYY-MM to which monthly contributions and fines are attributed.
- **Flat Upfront Interest:** Interest calculated once at loan origination as a fixed percentage of the principal amount, added immediately to form the total payable balance.
- **Master Contribution Table:** A cross-tabular matrix displaying all Chama members as rows and contribution/loan/fine categories as columns.
- **Shares/Savings:** The core equity contribution paid monthly by each member into the Chama's capital pool.
- **Soft-Void:** Marking an erroneous financial record as voided while retaining it in the database and pairing it with a reversing contra-entry.

### Appendix B: Analysis Models

#### B.1 Entity-Relationship Diagram (ERD)

```
+------------------+       1:N       +-----------------------+
|       User       |---------------->|      Transaction      |
+------------------+                 +-----------------------+
| _id (PK)         |                 | _id (PK)              |
| fullName         |                 | userId (FK -> User)   |
| email (Unique)   |                 | adminId (FK -> User)  |
| phoneNumber      |                 | referenceId (FK->Loan)|
| password (Hash)  |                 | type (Enum)           |
| role (admin/mbr) |                 | amount                |
| status           |                 | monthTarget (YYYY-MM) |
| joinedDate       |                 | status (active/voided)|
+------------------+                 +-----------------------+
         |                                       ^
         | 1:N                                   | 0..N
         v                                       |
+------------------+                             |
|       Loan       |-----------------------------+
+------------------+
| _id (PK)         |
| userId (FK->User)|
| principalAmount  |
| loanType         |
| interestRate     |
| totalInterest    |
| totalPayable     |
| amountPaid       |
| status           |
| disbursedDate    |
| dueDate          |
| clearedDate      |
+------------------+
```

#### B.2 Loan Lifecycle State Diagram

```
[Applied / Pending]
       |
       | (Admin Approves & Disburses)
       v
  [Disbursed] -------------------------------+
       |                                     |
       | (Repayments >= Total Payable        | (Current Date > Due Date
       |  on or before Due Date)             |  & Balance > 0)
       v                                     v
   [Cleared]                            [Overdue / Fine Assessed]
                                             |
                                             | (Principal + Interest
                                             |  + 20% Late Fine Paid)
                                             v
                                         [Cleared]
```

#### B.3 Bulk Payment Allocation Data Flow

```
[Admin Client]
     │  POST /api/transactions/allocate { userId, totalAmount, allocations[] }
     ▼
[Auth & RBAC Middleware] ──(Reject 403 if role !== 'admin')
     │
     ▼
[Validation Middleware] ───(Reject 400 if sum(allocations) !== totalAmount)
     │
     ▼
[Transaction Service (MongoDB ACID Session)]
     ├──► Insert Transaction docs (shares, christmas, retreat, etc.)
     ├──► If loan_repayment: Update Loan.amountPaid & check Loan.status = 'cleared'
     └──► Commit Session
     │
     ▼
[HTTP 201 Response] ──► Updated Ledger & Loan Balances
```

### Appendix C: Requirements Traceability Matrix

| Req ID | Requirement Summary | Business Objective | Verification / Test Case |
|--------|---------------------|--------------------|--------------------------|
| FR-AUTH-001 – 004 | JWT Login, Real-time Status Check, Global Read / Admin Write RBAC | Enforce strict write security while enabling group-wide transparency. | `auth.rbac.test.js`: Verify 403 for member POST/DELETE and 200 for member GET. |
| FR-TXN-001 – 003 | Monthly Categories, Christmas ≥ 2000 rule, Atomic Bulk Allocation | Accurate multi-category deposit splitting without partial DB writes. | `transaction.allocate.test.js`: Verify rollback when sum mismatches or loan overpays. |
| FR-TXN-004 | Audit Trail & Contra-Entry Reversals | Prevent tampering and preserve complete accounting history. | `transaction.void.test.js`: Confirm DELETE creates a negative contra-entry. |
| FR-LOAN-001 – 003 | Loan Tiers (≤200k 6m, >200k 12m @ 10%; Emergency 2m @ 0%) | Automate Chama credit rules accurately. | `loan.calculator.test.js`: Unit test boundary values (200,000 vs 200,001 vs emergency). |
| FR-LOAN-004 – 005 | Loan Disbursement & Auto-Clearance | Maintain real-time accuracy on active loan balances. | `loan.repayment.test.js`: Verify loan transitions to cleared when fully paid. |
| FR-FINE-001 – 003 | Admin Due Dates & Automated Fines (KES 500 shares / 20% loan interest) | Enforce timely contributions and loan repayments. | `fine.engine.test.js`: Simulate past grace period and verify idempotent fine creation. |
| FR-RPT-001 – 003 | Master Table, Member Statement, & PDF Download | Provide self-service auditability and offline records for members. | `statement.pdf.test.js`: Verify valid application/pdf buffer stream and totals. |

### Validation Checklist

- [x] All sections of IEEE 830 template completed.
- [x] All requirements assigned unique, categorized identifiers (FR-AUTH, FR-TXN, FR-LOAN, FR-FINE, FR-RPT, NFR, CON).
- [x] All requirements written with verifiable, quantitative criteria using active "shall" statements.
- [x] Glossary, ERD/State/Data Flow models, and Requirements Traceability Matrix included.
