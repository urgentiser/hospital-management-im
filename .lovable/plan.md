## Approach

Ship a **reusable worklist framework** wired as a **secondary "Worklist" tab** in every module. The existing Guided Workflow stays as the default tab — nothing about the shell, sidebar, patient banner, stepper, or form cards changes. Selecting a row opens the existing guided workflow with the record loaded, then the worklist refreshes.

Given the size (30+ modules, ~20 UI primitives, per-module configs), roll out in phases. This plan covers **Phase W1: framework + first 6 transactional worklists**. Later phases apply the same framework to remaining modules with per-module column/filter/action configs — same pattern, no new infrastructure.

## Phase W1 — Framework + priority worklists

### 1. Reusable framework (`src/components/worklist/`)

Single feature folder with the primitives the spec calls for, kept intentionally minimal but complete:

- `types.ts` — `WorklistColumn`, `WorklistFilter`, `WorklistAction`, `WorklistConfig<TRow>`, `WorklistQuery`, `SavedView`.
- `module-worklist.tsx` — orchestrator: toolbar + summary cards + table + pagination + drawer, keyed off a per-module config.
- `worklist-toolbar.tsx` — search (debounced), facility scope chip, saved-views menu, column selector button, filter-drawer trigger, refresh, export.
- `worklist-filter-drawer.tsx` — right-side sheet rendering filter fields from config (text, select, date-range, chips), Apply / Reset.
- `worklist-data-table.tsx` — sticky header, selectable rows, sort headers, density toggle, keyboard nav, loading skeleton, empty + error states, per-row `WorklistRowActions` menu.
- `worklist-status-chip.tsx`, `worklist-priority-indicator.tsx`, `worklist-sla-indicator.tsx`, `worklist-patient-cell.tsx`, `worklist-facility-cell.tsx`, `worklist-owner-cell.tsx` — small display atoms; SA formatting via existing `src/lib/format.ts`.
- `worklist-pagination.tsx`, `worklist-column-selector.tsx`, `worklist-summary-cards.tsx`, `worklist-detail-drawer.tsx`, `worklist-bulk-actions.tsx`, `worklist-empty-state.tsx`, `worklist-loading-state.tsx`, `worklist-error-state.tsx`, `worklist-export-action.tsx`.
- `use-worklist-query.ts` — TanStack Query hook that calls the module's typed service `listRecords` (server-side paging/sort via query params), keyed `["worklist", moduleKey, query]`, with `AbortController`, debounce, and stale-cancel.
- `use-saved-views.ts` — personal saved views persisted per user + module in localStorage; shared views come from config.

### 2. Console integration (`src/components/module-console.tsx`)

Add a **"Worklist"** tab pill next to "Guided workflow" and "Overview". No default change: guided workflow (or overview) still opens first. When the tab is active, render `<ModuleWorklist config={config.worklist} />`. Row action "Open" / "Continue" switches `activeTab` to `"flow"` and pushes the selected record into a new `useWorklistSelection` context so the guided workflow prefills. After a successful guided-workflow submit, invalidate the module's worklist query key.

Add `worklist?: WorklistConfig` to `ModuleConsoleConfig`. Providing it opts a module in; modules without it show no Worklist tab (so nothing regresses).

### 3. Per-module configs — ship in Phase W1

Six flagship transactional modules, using the exact column sets, statuses, filters, and row-action labels from the spec:

- **Admissions** (`_app.admissions.tsx`) — saved views: Awaiting Admission / Awaiting Bed / Current Inpatients / Discharge Pending / No-Authorisation.
- **Authorisations** (`_app.authorisations.tsx`) — saved views: Authorisations / Rejected / Issues / Reauthorisations.
- **Member Validation** (`_app.member-validation.tsx`).
- **Billing** (`_app.billing.tsx`) — saved views: Queue / Checks / Issues / Ready to Finalise / Finalised.
- **Claims** (`_app.claims.tsx`) — saved views: Queue / Validation Failures / Submitted / Rejected / Short Payments / Settled.
- **Pharmacy Dispensing** (`_app.pharmacy.dispensing.tsx`).

Each config declares columns, filter fields, statuses (mapped to `WorklistStatusChip` tones), row actions with `visibleWhen(row, principal)` guards, saved views, and which guided-workflow step to jump to per action.

### 4. Row-action → guided-workflow bridge

New `src/lib/worklist-selection.ts` — Zustand store holding `{ moduleKey, recordId, action, prefill }`. `ModuleConsole` reads it when the "Guided workflow" tab activates and passes `prefill` into `BusinessFlowWizard`. `BusinessFlowWizard` already accepts a starting step; extend it to accept `initialValues` (non-breaking optional prop).

### 5. Frontend-safe validation (spec §44)

Central in `use-worklist-query.ts` and `worklist-filter-drawer.tsx`: date-range order, numeric ranges, paging bounds, reason-required for controlled row actions (reuses existing `ActionDialog` reason field), permission-driven action visibility via `hasPermission` + `getDefaultModulePermissions`. Backend rejection surfaces via the existing `problem-details-banner.tsx` with row + filters preserved.

### 6. Accessibility & performance

- Debounced search (300 ms) inside `use-worklist-query.ts`.
- `AbortController` cancels stale requests.
- `keepPreviousData` for smooth paging.
- Skeleton rows during first load; row-level skeleton on refetch.
- Keyboard: arrow-key row focus, `Enter` opens drawer, `Space` selects, row-action menu is a proper `DropdownMenu`.
- No colour-only signalling: statuses combine chip colour + icon + label; priority uses shape + label; SLA uses icon + "Xh left / Overdue Xh".

### 7. Tests

- `src/components/worklist/__tests__/worklist-query.test.ts` — query-param mapping, date validation, pagination bounds, sort mapping, permission filtering of row actions.
- `src/components/worklist/__tests__/module-worklist.test.tsx` — loading / empty / error / row-action confirmation / reason capture / saved-view apply.
- Extend `src/services/modules/patient-journey.test.ts` with an end-to-end path: open Admissions worklist → filter → select row → launch guided workflow → complete → worklist refreshes.

## Explicitly out of scope for W1 (queued for later phases)

- Configs for the remaining ~25 modules (Triage, Clinical Assessments, Preadmission, Medical Events, Facilities, Practitioners, Ward, Theatre, Case Management, Clinical Coding, Funding, Accounting, Payments, Reimbursements, COID, AdHoc, Supplier Invoices, Documents & Printing, Workflow Inbox, Notifications, Integrations, Audit, Administration, Reporting, MultiTouch × 4, Catalogue Status, MyLife Portal) — each is a config-only file using the W1 framework.
- Cross-module "My Work" aggregator (spec §6) — depends on W1 primitives; ships after they stabilise.

## Technical notes

- No backend contracts, endpoints, HTTP verbs, or DTO names surface in UI. Every module still calls its own typed service via `getModuleService(moduleKey)` (already wired). "Confirmed Contract" labels are already gone; the framework will never introduce them.
- Currency ZAR, date `DD/MM/YYYY`, time `HH:mm`, tz `Africa/Johannesburg` — routed through existing `src/lib/format.ts` (extend if a helper is missing).
- No changes to colour scheme, typography, sidebar, shell, patient banner, stepper, or form cards. All new components use existing shadcn primitives + design tokens.

Say **go W1** to build the framework and the six flagship configs, or tell me to re-shape the phase (fewer modules first, different priority set, or start with the "My Work" aggregator instead).