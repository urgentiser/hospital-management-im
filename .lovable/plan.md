# Worklist Hardening Plan

This is a large, multi-phase refactor of the worklist subsystem. Guided Workflow remains the default tab; worklists stay secondary; the approved visual design, colours, typography, shell, sidebar, patient banner, stepper, and routes are untouched. Work is grouped into phases so we can land it in reviewable chunks and keep the build green throughout.

## Phase 1 — Contracts & framework foundations

Land the plumbing every later phase depends on.

- Rewrite `src/contracts/common/paged-result.ts`:
  - `PagedQuery<TFilters = Record<string, unknown>>` with `filters: TFilters`, `page`, `pageSize`, `search?`, `sortBy?`, `sortDirection?`, `facilityId?`.
  - `PagedResult<TItem, TSummary = Record<string, number | string>>` adds `summary?: TSummary`.
- Add `src/contracts/worklists/common-worklist.contracts.ts` with base `WorklistItem` (mandatory `availableActions: string[]`, `facilityId`, `status`, `updatedAt`, etc.) plus shared filter primitives (`DateRange`, `MultiSelect`, `BooleanFilter`).
- Add one contract file per module under `src/contracts/worklists/` (all 19 listed in the request) — each exports `<Module>WorklistItem`, `<Module>WorklistFilters`, `<Module>WorklistSummary`.
- Update `src/services/modules/types.ts` — `ModuleService<TItem, TFilters, TSummary>` with typed `listRecords`, plus a new `getSummary(query)` method (default implementation calls `listRecords` when the backend omits summary).
- Update `src/services/modules/base-module.service.ts`:
  - Serialise every filter into query params in API mode (arrays as repeated params, booleans as `true/false`, dates as ISO strings).
  - Pass `filters` through in mock mode.
- Update `src/services/modules/mock-pager.ts` to accept a `filterMatchers` map so mock mode honours the same filter contract as the API.
- Delete `.env` from the repo (keep `.env.example`).

## Phase 2 — ModuleWorklist runtime

- `src/components/worklist/module-worklist.tsx`
  - Send `filters`, `search`, `facilityId`, sort, page to the service through the new `PagedQuery`.
  - Read `summary` from `PagedResult`; if absent, call the service `getSummary` in a second query. Summary cards no longer derive from the current page.
  - Enforce the action rule: `row.availableActions.includes(action.key) && permission && facilityAccess && visibleWhen`. Remove the `!a.launchesGuidedWorkflow` exception.
  - Facility gating helper: check `principal.facilities` (active + cross-facility grants) against `row.facilityId` before showing or executing.
  - After a successful action / guided-workflow completion: clear the selected record via `useWorklistSelection.clear()`, keep search/filters/page/sort/columns/active view, and invalidate only that module's queries.
- `src/lib/worklist-view-store.ts`
  - Extend state with `pageSize`, `activeViewKey`, `defaultViewKey`, `personalViews: Record<string, SavedView>`.
  - Actions: `saveView`, `renameView`, `deleteView`, `setDefault`, `applyView`, `applySharedView`, `resetToDefault`.
  - Shared views are read-only for non-admins (checked via principal permission `worklist:manage-shared-views`).

## Phase 3 — Bespoke worklist configs

- Create `src/worklists/<module>.worklist.tsx` for every business module, each exporting a fully-specified `WorklistConfig` (columns, filters, statuses, saved shared views, row actions, summary tiles, sort options, search fields) sourced from the like-for-like spec.
- Modules covered: patient maintenance, member validation, triage, preadmission, admission, authorisation, ward, theatre, case management, clinical coding, billing, accounting, payments, claims, documents, integrations, administration (per submodule), facilities, practitioners, mylife portal, platform services.
- `makeDefaultWorklist` stays only as a fallback for non-transactional stubs.

## Phase 4 — Pharmacy split

- Nine typed queues under `src/worklists/pharmacy/`: dispensing, ward-requests, to-follows, repeats, compounding, credits, retail-sales, emergency-cupboard, surgical-issues.
- Each gets its own service method on `pharmacy.service.ts` (`listDispensing`, `listWardRequests`, …), its own record type, its own query key, its own config, and — in API mode — its own route or mandatory `transactionType` filter.

## Phase 5 — Supporting worklists

- Full worklists for Facilities, Practitioners, Documents & Printing, MyLife Portal, Platform Services.
- Administration worklists: Users, Roles, Permissions, Facility Access, Approvers, User Logs, Locked Resources, Document Templates, Printers, Print Servers, Feature Flags, Workflow Configuration, Reference Data, Integration Configuration.

## Phase 6 — Tests & verification

- New Vitest suites under `src/worklists/__tests__/` and `src/components/worklist/__tests__/`:
  - Advanced filters reach the service (spy on `listRecords`).
  - Mock filters match documented API behaviour.
  - Paged totals and multi-page summary aggregation.
  - `availableActions` gating for both state-changing and guided-workflow actions.
  - Facility action restrictions.
  - Persistent filters/page across tab switches.
  - Selection cleared after workflow completion (search/filters preserved).
  - Personal saved views: save / rename / delete / default / restore.
  - Pharmacy queue separation (each queue calls its own service method).
  - Summary values across multiple pages.
  - Missing `availableActions` denies every state change.
  - Backend 409 and 422 surfaced through the problem-details banner.
- Run and report: `tsgo`, `bunx vitest run`, production build.

## Technical notes

- All new contracts live under `src/contracts/worklists/` and are re-exported through an index barrel to keep imports terse.
- `WorkflowItem` remains for the guided-workflow / mock store only; production worklist code paths switch to the typed items via a thin adapter in `base-module.service.ts` so mock mode continues to work during the migration.
- No route files, shell, sidebar, banner, stepper, or design tokens are modified.

## Rollout

Because this is a very large change set, I will land it phase by phase (Phase 1 first, then 2, etc.), running typecheck + tests after each phase and pausing for review before moving on. Please confirm you want me to proceed on that basis, or tell me if you'd prefer a different sequencing (e.g. all contracts first, then all UI, then all tests).
