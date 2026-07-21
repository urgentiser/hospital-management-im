This is a large scope. I'll deliver it in numbered phases so you can approve/steer between each. Nothing here changes the approved shell, sidebar, colours, typography, patient banner, guided workflow, stepper, or form-card designs.

## Guardrails (apply to every phase)
- Keep guided-workflow-first behaviour on every transactional module.
- Do not touch: shell, sidebar layout, colour tokens, fonts, banner, stepper, form-cards, dashboard style, working routes.
- Strip user-facing technical metadata (Confirmed Contract, Service Interface, DTO, Topic, CQRS names, "Publish event/audit" steps, Legacy Evidence, backend service class names). Replace terminal wizard step with `Review → Confirm → Completed`.
- No direct Service Bus calls from frontend. No hardcoded demo identity.

## Phase A — Structural cleanup & navigation (safe, no behaviour regressions)
1. Add **Member Validation** to Patient Care nav (route already exists).
2. Add **Payments** (`/payments`) and **Claims** (`/claims`) routes + nav entries under Funding & Revenue.
3. Remove Confirmed Contract / backend metadata panels from `ModuleConsole`, `business-flow`, `operational-process`, `module-stub`. Replace "Publish Event / Publish Audit" wizard steps with a single "Completed" outcome step.
4. Delete truly obsolete files once nothing imports them: `compatibility-api.service.ts`, `workflow.service.ts`, confirmed-contract / backend-contract / legacy-evidence components. Keep shared `http-client`, `correlation`, `problem-details`, `query-keys`, `auth-client`.

## Phase B — Typed module service layer
Introduce `src/services/modules/<module>.service.ts` with **named typed methods** (not generic CompatibilityOperation) for every module listed in the brief, including new: `payments`, `claims`, `member-validation`, `reporting`, `notifications`, `adhoc`, `supplier-invoices`, `multitouch-*`, `*-catalogue`.
Each service:
- Uses shared `apiRequest` + Problem Details + correlation ID.
- Falls back to mock data while `appConfig.dataMode === 'mock'` so UI stays functional.
- Exposes exactly the method names in the brief (e.g. Admissions: `searchAdmissions`, `admitPatient`, `transferPatient`, `dischargePatient`, `registerBirth`, `getAvailableActions`, ...).

## Phase C — Rule packs per module
Create `src/rules/modules/<module>.rules.ts` for all 31 modules in §38. Each rule tagged `frontend-enforced | backend-enforced | frontend-warning | configuration | external-decision`. Only frontend-enforced/warning rules render; source metadata never shown. Register via existing rule registry.

## Phase D — Action-scoped guided workflows
Introduce an **Action selector** inside each module console (chip row above the stepper, same visual language). Selecting an action swaps the wizard steps for that action's flow. Ship the action lists exactly as specified for:
- Patient Maintenance, Member Validation, Triage, Clinical Assessments, Preadmission, Admissions, Authorisations, Medical Events, Ward, Theatre, Pharmacy, Case Management, Clinical Coding, Billing, Accounting, Payments, Claims, Reimbursements, COID, Adhoc, Supplier Invoices, Documents & Printing, Workflow Inbox, Notifications, Integrations, Audit, Administration, Facilities, Practitioners, Funding.
Each action's steps, frontend validations, and "leave-to-backend" boundary follow the brief verbatim.

## Phase E — TanStack Query wiring
Per-module `queries/` + `mutations/` with module-scoped query keys, invalidation on write, loading/error/empty/stale states, cancellation, retry policy. Wire the guided workflow submit path through mutations; wire supporting worklist/history tabs through queries.

## Phase F — Auth-driven identity & permission gating
- Replace hardcoded "Dr. K. Naidoo / Clinical Lead / Demo" everywhere with `useAuth()` principal (name, role, permissions, facilities, active facility, session status).
- Permission-gate nav entries, action chips, and submit buttons via existing `PermissionGate`.
- Session-expiry banner + `/unauthorised` page. Disable mock auth in production build.

## Phase G — Problem Details error UX
Central handler: on 422, map `errors[field]` → inline field errors, focus first invalid, show validation summary, preserve input, surface `correlationId` in the support drawer. Never show stack traces.

## Phase H — Tests
Unit tests for each rule pack. Component tests for wizard navigation, disabled submit, validation summary, API error mapping, unsaved-changes guard. E2E happy paths listed in §43 using Playwright (already available in sandbox).

## What I need from you
Confirm you want me to start with **Phase A** now (structural cleanup + nav for Member Validation, Payments, Claims + metadata stripping). Each subsequent phase (B → H) ships on your `go` command, same pattern as prior phases. Say **go A** to begin, or tell me to re-order / drop phases.
