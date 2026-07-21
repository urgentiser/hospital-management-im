# Impilo Patient Journey — Like-for-Like Modernisation Plan

This is a large body of work. To keep the app deployable at every step, I'll ship it in tight phases against the existing premium design and colour scheme — no visual rework, no route removals, no backend jargon on user-facing screens.

## Guardrails (apply to every phase)

- Keep current colours, typography, layout primitives, routes and module names.
- Remove any remaining user-facing mentions of service names, endpoints, "backend contract", "legacy", "compatibility contract", payload modes.
- Preserve Impilo action names, process order, field labels, validation sequence, status terminology.
- Frontend enforces only safe validations (required, formats, date order, reasons, context). Authoritative rules (duplicates, beds, stock, eligibility, tariffs, adjudication, concurrency, entitlement) stay backend-owned — surfaced as guidance only.
- Every state-changing action carries correlation ID + facility + patient context and appears on the module timeline.

## Global patterns to standardise first (Phase 0)

Foundations reused by every module — done once, inherited everywhere.

1. **Global Patient Banner** (`src/components/patient-banner.tsx`)
   Name · MRN · DOB · age · sex · facility · visit/admission · ward/bed · scheme · member-validation status · authorisation status · allergies · clinical alerts · infection warnings · admission status. Rendered on every patient-scoped module. Blocks patient actions until a patient is selected (except "Register New Patient").
2. **Consistent page skeleton** for transactional modules: header → breadcrumb → tabs → facility context → patient banner → worklist/search → familiar action → guided capture → validation summary → review → result & next actions → timeline. Wired through `ModuleConsole` so every module inherits it.
3. **Validation summary + field-error mapping**: shared component that groups blocking vs advisory errors, disables submit while blocking errors exist, surfaces correlation ID on API failures, maps field errors to inputs.
4. **Unsaved-changes guard** on all wizards.
5. **Per-module service contracts**: keep the existing `src/services/modules/*` split, wire TanStack Query keys per module, standardise `AbortController` + correlation propagation + Problem Details mapping. No generic workflow service leaks into UI.
6. **Copy sweep**: remove any remaining "legacy / compatibility / backend contract / endpoint / payload mode" strings from operational pages.

## Phased module rollout

Each phase = worklist-first landing + guided actions matching the spec + validation summary + result/next-actions + timeline. All existing modules stay in place; content is upgraded in place.

**Phase 1 — Scheduled patient journey core**
Patient Maintenance · Member Validation · Preadmission · Clinical Assessment · Authorisations · Admissions (standard + direct + no-auth + move + discharge + birth).

**Phase 2 — Clinical operations**
Ward Management (bed board, ward treatment, nursing card, accommodation) · Theatre Management (schedule, register, preference card) · Pharmacy (inpatient, ward, compounding, take-home, retail, emergency cupboard) · Medical Events · Triage (emergency journey).

**Phase 3 — Funding & revenue**
Case Management · Clinical Coding · Funding · Billing · Accounting · Payments (receipt/refund/reversal/suspense) · Claims · Reimbursements · COID · AdHoc · Supplier Invoices.

**Phase 4 — Organisation & platform**
Facilities · Practitioners (+ sanction flow) · Workflow Inbox · Notifications · Documents & Printing · Integrations / Service Bus / Failed Messages (health-first, payload hidden) · Audit Trail (immutable, no edit) · Reporting · MyLife Portal · MultiTouch launchers · Catalogue launchers (PCMS stays external).

**Phase 5 — Administration & acceptance**
Admin sections (Users, Roles, Permissions, Facility access, Approvers, Unlocking, Workflow/Facility/Ward/Theatre config, Templates, Printers, Feature flags, Reference data, Integration settings) with permission + reason + confirmation + audit on high-risk changes.
End-to-end acceptance walkthrough: login → facility → register → validate → preadmit → assess → authorise → admit → allocate bed → ward/theatre/pharmacy → case → coding → discharge → bill → payment/claim → documents → integration status → audit.

## Technical notes

- Reuse `ModuleConsole`, `BusinessFlow`, `OperationalProcessConsole`, `AdminSectionPage`, `UI kit` — extend, don't fork.
- Add `PatientBanner` + `useSelectedPatient` guard hook; mount banner via `ModuleConsole` when config marks the module patient-scoped.
- Add `ValidationSummary` + `useUnsavedGuard`; wire into `BusinessFlow`.
- Standardise TanStack Query keys under `src/services/query-keys.ts` (already present) — one namespace per module service.
- Copy sweep via `rg` for forbidden strings; replace with plain-language equivalents.

## What I need from you

Confirm to start, and tell me whether to begin at **Phase 0 (foundations)** — recommended, because every later phase depends on the banner, validation summary and copy sweep — or jump straight into **Phase 1** and retrofit foundations as we go.
