# Worklist & Terminology Hardening

Guided workflow stays the default tab. Shell, colours, typography, banner, stepper, and existing working actions are untouched.

## 1. Terminology scrub (items 2, 3, 4)

Global search/replace pass across `src/**` (routes, components, configs, docs strings):
- "Admissions Service" → "Admissions"
- Remove step/copy referencing: "Publish admission and occupancy events", "Publish event", "Publish audit", "Backend service", "Service Bus handoff", "Contract", "DTO", "Payload", "CQRS"
- Any wizard step whose only purpose is publishing events/audits is deleted (events happen automatically after commands).
- Rewrite `_app.admissions.tsx` label to `Clinical · Admissions`.

## 2. Paged worklist contracts (items 8, 9, 10, 11)

New types in `src/contracts/worklist/`:
- `WorklistItem` base (id, reference, title, subtitle, status, facilityId, updatedAt, availableActions: string[], plus module-typed fields).
- Per-module typed items: `AdmissionWorklistItem`, `AuthorisationWorklistItem`, `BillingWorklistItem`, `ClaimWorklistItem`, `MemberValidationWorklistItem`, `PharmacyDispensingItem`, `PharmacyWardRequestItem`, `PharmacyToFollowItem`, `PharmacyRepeatItem`, `PharmacyCompoundingItem`, `PharmacyCreditItem`, `PharmacyRetailSaleItem`, `PharmacyEmergencyCupboardItem`, `PharmacySurgicalIssueItem`, `FacilityWorklistItem`, `PractitionerWorklistItem`, `DocumentPrintingItem`, `MyLifePortalItem`, `PlatformServiceItem`, `AdminUserItem`, `AdminFeatureFlagItem`, etc.

`ModuleService.listRecords` signature becomes:
```ts
listRecords(query: PagedQuery, signal?): Promise<PagedResult<TItem>>
```

`base-module.service.ts`: when `dataMode === "api"` — send `page`, `pageSize`, `search`, `sortBy`, `sortDirection`, `facilityId`, `status`, plus module filters to backend and return the response verbatim (no client sort/filter/slice). When `dataMode === "mock"` — a mock pager applies the same query over seeded typed items and synthesises `availableActions` per row.

## 3. Row-action gating (items 12, 13)

`ModuleWorklist` shows an action only when all three are true:
- `row.availableActions.includes(action.key)`
- `hasPermission(principal, permissions[action.permission])`
- `principal.facilities` includes `row.facilityId` (or has override)

Backend re-check is documented in service comments; UI never trusts client state alone.

## 4. Bespoke worklist configs (items 1, 5, 6, 7, 19)

Delete `makeDefaultWorklist` usage as the *final* implementation. Keep the helper but only for cheap admin lists that genuinely have no bespoke columns. Author bespoke `WorklistConfig` under `src/worklists/<module>.config.ts` for every business module:

Patient care: patients, triage, preadmissions, clinical-assessments, admissions, medical-events, documents.
Clinical ops: ward, theatre, pharmacy (see queue split below), case-management, clinical-coding.
Funding: authorisations, funding, billing, accounting, coid, reimbursements, supplier-invoices, account-enquiries, claims, member-validation, payments.
Organisation: facilities, practitioners, workflow-inbox, mylife-portal.
Platform: integrations, service-bus, failed-messages, audit, notifications, system-health.
Administration: users, facilities-admin, workflow-config, documents-admin, feature-flags, printing, reference, support.

Each config specifies columns, filters (with real option sets), status map, saved views (seeded shared views), row actions with `permission` + `visibleWhen` hooks, and a `summary` KPI reducer.

Admissions: **remove `Discharge selected` bulk action** and every other prohibited bulk (admit, finalise, refund, reversal, patient merge, clinical sign-off, claim submission). Only bulk actions backed by an implemented module API remain (mostly none — leave `bulkActions` empty).

Pharmacy split — 8 separate service instances under `src/services/modules/pharmacy/`:
`dispensing`, `ward-requests`, `to-follows`, `repeats`, `compounding`, `credits`, `retail-sales`, `emergency-cupboard`, `surgical-issues`. Each has its own `WorklistConfig`. `PharmacySectionPage` selects the correct config per section key.

## 5. Persistent worklist view state (items 14, 15, 16)

New `src/lib/worklist-view-store.ts` (Zustand + `persist`) keyed by `moduleKey`:
```ts
{ search, filters, page, pageSize, sortBy, sortDir, visibleColumns, activeViewKey }
```
`ModuleWorklist` reads/writes through this store instead of local `useState`. Switching to Guided Workflow and back restores everything. On successful workflow completion, `useWorklistSelection.clear()` runs but view state is left intact.

## 6. Saved views (items 17, 18)

Extend the view store with `personalViews: Record<moduleKey, SavedView[]>` and actions: `saveView`, `renameView`, `deleteView`, `setDefaultView`, `restoreView`. Shared views come from config (`savedViews`, marked `shared: true`) and are read-only in the UI (no rename/delete). New "Save current view" control in the worklist toolbar.

## 7. Env hygiene (item 20)

- Add `.env` to `.gitignore`.
- `git rm --cached .env` equivalent via shell `rm` is not applicable (git managed by host); instead ensure `.env.example` exists mirroring keys with placeholder values and note in `AGENTS.md` that `.env` is local-only.

## Technical notes

- No route file relocations, no shell/nav changes.
- `ModuleConsole` unchanged except it passes the module's bespoke config instead of `makeDefaultWorklist(...)`.
- `apiRequest` already supports query strings via caller; `base-module.service` builds `URLSearchParams` from `PagedQuery`.
- Mock pager lives in `src/services/modules/mock-pager.ts` — pure function `page<T>(items, query, filterFn, sortMap)`.
- Typecheck must pass at end.

## Out of scope

- No visual redesign.
- No new modules; only worklist/config work on existing modules.
- No changes to guided workflows beyond deleting the prohibited event-publishing steps and terminology.
