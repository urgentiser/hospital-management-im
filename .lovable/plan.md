## Admissions Production MVP — Hardening Plan

Scope: Admissions module only. Design, shell, sidebar, header, tokens, stepper, form cards, and patient banner remain unchanged. All 34 sections of the brief will be delivered, but as sequenced phases so each lands as a reviewable, working slice on top of the existing wizards.

### Phase 1 — Structural correction (foundation)
Fixes the "old flow still visible" and "wrong catalogue" problems first so every later phase builds on the right shell.

- Remove the old ModuleConsole `businessFlow` for Admissions. `_app.admissions.tsx` renders **Process Selector → Worklist** only (with supporting tabs: No-Auth Worklist, Rejected Auth, Patient Location, Billing Checks, Invoices & Statements, Statement of Account, Dashboard, Documents, Timeline, Audit).
- Rewrite `process-registry.ts` with the 8 corrected groups (Creation / Identification & Location / Management / Funding & Authorisation / Financial & Billing / Departure / Corrections & Exceptions / Operational Monitoring). Move "No-Auth Admissions" under Funding & Authorisation. Add every missing process (Medical Aid Details, Authorisation Search, Rejected Auth Hospital + Group, Past COID/Injury/Poisoning, Invoices & Statements, Statement of Account, Notes & Documents, Undischarge EU, Amend Admission).
- Process Selector header uses `admissionProcesses.length` dynamically. Remove the "All 22 processes" string.
- Every process card enforces `Admissions.*` permission via `PermissionGate` in addition to the elevated badge.

### Phase 2 — Journey context + facility/patient entry
Every wizard now starts with facility → patient search, sharing one context.

- New `useAdmissionJourney` zustand store: `{ facilityId, selectedProcess, patientId, patientMRN, preadmissionId, emergencyVisitId, admissionDraft, fundingDraft, authorisationDraft, completedSteps }` persisted to sessionStorage, cleared on completion.
- New `FacilityConfirmStep` + `PatientSearchStep` components (search by MRN/ID/passport/name/DOB/mobile/membership; results table with duplicate warnings; "Register New Patient" branch).
- New embedded `PatientRegistrationWizard` (Demographics → Identification → Contact → Address → Next of kin → Employment → Consent → Funding → Guarantor → Documents → Review → Create) which returns to Admissions journey preserving `selectedProcess` + `facilityId`.
- All five creation wizards (Admit / Convert Preadmission / Direct / Emergency / No-Auth) are refactored to start from these shared steps.

### Phase 3 — Typed contracts + service hardening
- Replace `WorkflowItem`-style generic fields with the 27 typed contracts listed in section 26 (`AdmissionDetail`, `AdmissionWorklistItem`, `AdmissionAvailableAction`, `PatientSearchResult`, `PreadmissionSearchResult`, `EmergencyVisitSearchResult`, all Create/Convert/Discharge/Move/Birth request types, `BedAvailability`, `PreDischargeReviewResult`, `BillingCheckItem`, `FinaliseBillResult`, `AdmissionInvoice/Statement/Account/TimelineItem/AuditItem`).
- `admissions.service.ts` exposes typed methods per contract; wired through `apiRequest` with Problem Details mapping.
- Query keys namespaced under `admissions.*` (21 keys from section 30). Mutations invalidate only the affected keys.
- Remove `MOCK_AUTHS`, `MOCK_CHECKS`, hard-coded ward "3B · Room 12", random bill numbers, and any local financial calculation.

### Phase 4 — Complete "Admit a Patient" 16-step flow
The full guided workflow from section 8: Facility → Patient search → Context review → Source → Details → Practitioner → Funding → Member validation → Authorisation → Special context (conditional COID/Injury/Poisoning/Maternity/Neonatal) → Consent & Documents → Readiness → Review → Confirm → Bed allocation → Completed screen with next actions.

### Phase 5 — Alternate creation wizards
Convert Preadmission, Direct Admission, Emergency/A&E, No-Authorisation — each restructured to their section 9–12 flows on the shared facility+patient foundation. Duplicate-admission prevention. Emergency exception permitted only with permission.

### Phase 6 — Ward & bed allocation, Move, Register Birth
Real bed selector: ward → room → bed with live availability statuses (Available/Reserved/Occupied/Cleaning/Blocked/OOS). Move-to-Ward with previous-location guard. Register Birth with baby MRN + neonatal allocation and duplicate-birth guard.

### Phase 7 — Admission Workspace
`/admissions/{id}` becomes the full workspace with typed `AdmissionDetail`, persistent patient banner, backend-driven `availableActions`, and tabs: Summary, Patient, Medical Event, Funding, Medical Aid, Insurance, COID, Injury, Poisoning, Authorisation, Consent, Practitioners, Current Location, Accommodation History, Ward/Theatre/Pharmacy Activity, Clinical Assessments, Coding, Case Management, Charges, Billing Checks, Documents, Notes, Timeline, Audit.

### Phase 8 — Funding & Authorisation processes
Medical Aid Details, Rejected Authorisations (Hospital + Group with permission gate), Past COID/Injury/Poisoning admissions views.

### Phase 9 — Pre-discharge, Discharge, Billing Checks, Finalise Bill
Live readiness from backend (no hard-coded checks). Discharge 5-phase flow. Billing checks + bill finalisation returns real `FinaliseBillResult`. Admission state moves to `Finalised`, not back to `Discharged`.

### Phase 10 — Invoices, Statements, Statement of Account, Documents, Patient Location
Invoice/statement generation with download/print/reprint/email. Statement of Account with ZAR formatting and full transaction history. Real document upload with progress/validation/malware-scan status. Patient location driven by real query, not sample data.

### Phase 11 — State, concurrency, errors, audit, tests
Draft save/resume, unsaved-changes prompt, idempotency keys on all create/convert/discharge/birth. HTTP 409 handling with field diff. Problem Details banner already exists; wire correlation IDs. Full audit event list from section 31. Unit + component + Playwright e2e covering the 26 acceptance journeys from section 32.

### Technical notes
- No new third-party dependencies expected; uses existing `apiRequest`, `useModuleService`, `PermissionGate`, `PatientBanner`, `KpiCard`, `BusinessFlow` stepper, and worklist primitives.
- Backend endpoints are assumed available at `admissions/*`, `patients/*`, `preadmissions/*`, `emergency-visits/*`, `beds/*`, `billing/*`, `documents/*`. Where an endpoint is missing on the backend, the service will surface a Problem Details error instead of falling back to mock data.
- Zero design token or component-shape changes.

### Deliverable per phase
Each phase ends with: passing `tsc --noEmit`, updated unit tests for the slice, and a short verification note (screenshot or Playwright trace for UI slices).

### Recommended first commit
Phase 1 + Phase 2 together, because the corrected catalogue and the shared facility/patient journey are prerequisites for every wizard rewrite in Phases 4–6. Phases 3–11 then land in order.

Please confirm to proceed with Phase 1 + 2, or tell me to sequence differently (e.g. contracts first, or all phases in one large drop).