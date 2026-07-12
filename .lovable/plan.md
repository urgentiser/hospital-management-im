
# Impilo Platform — Priority Improvements Plan

This is a large, multi-phase rebuild touching auth, RBAC, routing, data, and 12+ modules. I'll deliver it in ordered phases so each phase compiles and is usable before the next begins. All work stays in the frontend (mocked auth, mocked Entra, in-memory stores) — no backend/Cloud changes.

## Phase 1 — Foundations (rules, auth, RBAC, facility scope)

**New `src/rules/` directory** — single source of truth:
- `src/rules/roles.ts` — role definitions: `Administrator`, `Clinical User`, `Operational User`, `Support User`, `Reporting User`, `Read-only User`.
- `src/rules/permissions.ts` — permission matrix (module → action → allowed roles) with human-readable **reason strings** for every denial.
- `src/rules/workflow.ts` — state machines for Admissions, Billing, Documents, Integration messages.
- `src/rules/schemas.ts` — Zod schemas for Patient, Admission, Payment, Document, etc.
- `src/rules/facilities.ts` — canonical facility list + scope helpers.
- `src/rules/formatting.ts` — ZAR currency (`R 1 234,56`), SA date (`YYYY-MM-DD` / `DD MMM YYYY`), number spacing.

**Mocked Microsoft Entra ID auth** (`src/lib/auth/`):
- `entra-mock.ts` — simulated MSAL flow: login popup, token issue, 30-min sliding session with expiry warning + auto-logout.
- `auth-context.tsx` — React context: `user`, `roles`, `activeRole`, `facilities`, `activeFacility`, `login()`, `logout()`, `switchRole()`, `switchFacility()`, `isExpiring`.
- `PermissionGate.tsx` — wraps buttons/fields/nav items. When denied: renders disabled state with tooltip **"Unavailable — <reason>"**.
- `_authenticated` route guard: redirects to `/login` when no session; shows session-expiry modal at T-2min.

**Global chrome:**
- Top-bar **Role Simulator** dropdown (visible, labelled "Simulating: <role>").
- Top-bar **Facility Selector** — filters all worklists via `useFacilityScope()`.
- Session countdown pill when < 5 min remaining.

## Phase 2 — Mock data expansion

- `src/lib/mock/` split by domain: `patients.ts`, `admissions.ts`, `medical-events.ts`, `documents.ts`, `payments.ts`, `integrations.ts`, `reports.ts`, `notifications.ts`, `tasks.ts`, `audit.ts`.
- Each worklist: **≥20 realistic records** with SA names, ID numbers, ZAR amounts, valid SA date formats, spread across 6 facilities.

## Phase 3 — Reusable state components

`src/components/states/`:
- `LoadingState`, `EmptyState`, `ErrorState`, `UnauthorisedState`, `NotFoundState`, `StaleDataBanner`, `OfflineBanner`.
- `DataTable` — sortable, filterable, paginated, column-visibility toggle, saved-views (localStorage).
- `ConfirmDialog` — reusable confirmation with reason capture.

## Phase 4 — Patient journey

- `/_app/patients` — searchable, filterable (scheme, status, facility, age range, practitioner), paginated table using `DataTable`.
- `/_app/patients/$id` — layout with **persistent PatientBanner** (name, MRN, DOB, age, gender, scheme, active admission, alerts).
- Tabs: `demographics`, `admissions`, `medical-events`, `documents`, `tasks`, `audit`.
- Route files: `_app.patients.index.tsx`, `_app.patients.$id.tsx`, `_app.patients.$id.demographics.tsx`, etc.

## Phase 5 — Admission journey

- `/_app/admissions` — worklist with filters + saved views.
- **Create Admission wizard** (`/_app/admissions/new`): Zod-validated form, **Save draft** → localStorage, **Admit** → adds to worklist.
- `/_app/admissions/$id` — detail with actions: **Allocate Bed**, **Transfer**, **Discharge**, **Cancel**, **Link Authorisation**. All gated by `PermissionGate` + confirmation dialogs.
- Event timeline component reused across modules.

## Phase 6 — New standalone pages

- `/_app/medical-events` — worklist + detail drawer.
- `/_app/my-work` — assigned tasks & queues for active user.
- `/_app/notifications` — inbox with read/unread, categories.
- `/_app/profile` — user profile, session info, role/facility.
- `/_app/system-health` — service status tiles, SLOs.
- `/_app/failed-messages` — dead-letter queue with retry/ignore.

## Phase 7 — Integration Monitor expansion

Rebuild `/_app/integrations` for **Azure Service Bus**:
Columns: message ID, correlation ID, topic/queue, subscription, source, target, entity type, timestamp, retry count, latency, error type, error summary, status.
Row actions (permission-gated): **Review**, **Retry**, **Ignore**, **Copy Correlation ID**, **Download Error**, **View Timeline**.
Payload metadata drawer with JSON preview.

## Phase 8 — Billing & Payments

Rename module to **Billing & Payments** with sub-routes:
- Account summary, outstanding balance, payment capture, processing status, receipt, refund, reversal, reconciliation timeline.

## Phase 9 — Documents

Upload with drag-drop, file-type validation, size validation, category picker, progress bar, virus-scan status, rejection reason, preview (PDF/image), download, archive.

## Phase 10 — Reports (BI dashboard)

Facility + date-range filters, KPI cards, charts (Recharts — already in stack), saved reports list, drill-through into worklists, export progress toast.

## Phase 11 — PCMS External Access

`/_app/pcms` — a **launcher page only**. Cards linking out to PCMS (external), with clear note "PCMS is a separate system". No PCMS functionality rebuilt.

## Phase 12 — Formatting sweep

Global find-replace via `formatting.ts` helpers. Fix spacing, pluralisation ("1 patient" vs "2 patients"), currency (`R`), SA dates.

---

## Technical notes

- Stack stays TanStack Start + Query + Tailwind + shadcn + Recharts. No new backend.
- Auth is **fully mocked** — no real Entra ID, no Cloud enablement. Session state persisted in `sessionStorage`.
- All rules live in `src/rules/`. Pages import rule functions; they never contain literal role checks or amount formatting.
- Existing `ModuleConsole` pattern is preserved for modules that already use it; new richer journeys (Patient, Admission, Integrations, Billing, Reports) get purpose-built layouts.
- Route file naming follows TanStack conventions already in use (`_app.patients.$id.tsx`, etc.).

## Delivery

Given the scope (~40+ new files, ~15 edits), I'll implement in the phase order above, verifying typecheck after each phase. I'll pause and confirm only if a decision is ambiguous; otherwise I'll ship straight through.

**Approve this plan and I'll start with Phase 1 (rules + mocked Entra auth + role/facility selectors) in the next turn.**
