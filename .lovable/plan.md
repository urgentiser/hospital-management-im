# Admissions upgrade — phased plan

Also fixed this turn: the `/auth?redirect=/auth?redirect=…` loop when the shell redirected an already-`/auth` path back into itself.

Scope: Admissions module only. No changes to the approved shell, sidebar, header, patient banner, facility selector, colours, typography, cards, steppers, or other modules. Guided processes remain the default tab; every new surface is a secondary tab or contextual view within Admissions.

## Delivery phases

### Phase A — Foundations (typed contracts + service)
- `src/modules/admissions/contracts/*` — one file per contract: admission summary, detail, worklist item, actions, timeline, billing check, and one request contract per process (create / from-preadmission / direct / emergency / no-auth / allocate-bed / move / change-practitioner / register-birth / discharge / cancel / discontinue / undischarge / miscellaneous charge).
- `src/modules/admissions/services/admissions.service.ts` — all methods from spec §33 wired against the existing mock-pager for now, backend-shaped so a real API is a drop-in.
- `src/rules/modules/admissions.rules.ts` — every frontend-enforced validation from spec §35 classified.
- Query keys under `admissions.*` per spec §41.

### Phase B — Guided processes shell + selector
- New Admissions module page that keeps the existing chrome and swaps the process launcher for the grouped selector (Create / Manage / Funding / Movement / Discharge / Financial / Enquiry) from spec §4, cards showing action name, description, required privilege, applicable states, patient/facility/high-risk indicators.
- Shared patient + admission context provider so processes never re-prompt for identity when it's already loaded.
- Each of the 20 processes gets its own guided workflow file — no giant single stepper. Reuses the existing `BusinessFlow` stepper design unchanged.

### Phase C — Admission Creation cluster
Admit a Patient · Convert Preadmission · Direct Admission · Emergency/A&E · No-Authorisation. Full validations and backend-authoritative readiness call, plus ward/bed allocation continuation.

### Phase D — Admission Management + Location
View Admission (full Admission Detail Workspace with all tabs from spec §16) · Patient Location · Move to Ward · Maintain Admission · Maintain Practitioner · Register Birth. Includes accommodation-history timeline and movement history.

### Phase E — Funding, Authorisation, enquiry
Medical Aid Details · Authorisation Search · No-Authorisation Admissions queue · Rejected Authorisations (Hospital + Group) · Past COID / Injury / Poisoning enquiry views.

### Phase F — Charges + financial completion
Miscellaneous Charges · Manage Billing Checks · Finalise Bill (blocked while backend checks fail) · Invoices and Statements · Statement of Account. ZAR formatting throughout.

### Phase G — Departure & corrections
Discharge Patient (Phases A–E from spec §22, not just a date field) · Cancel Admission · Discontinue Admission · Undischarge EU Patient. High-risk actions require reason + confirmation + permission gating.

### Phase H — Worklist, dashboard, audit
- Admissions worklist reconfigured with the full column set, statuses, and saved views from spec §29, using `availableActions` from backend for row actions. No bulk high-risk operations.
- Admissions Dashboard (KPIs + charts) with drill-through into the worklist.
- Immutable timeline + audit tab on Admission Detail sourced from the audit service contract.

### Phase I — Non-functional hardening
Permissions per spec §36, Problem Details error mapping (409 refresh, 422 field mapping), correlation IDs, observability-safe logging, TanStack Query invalidations per spec §41, Vitest coverage of the unit + component checklist in spec §42.

## What stays the same
Sidebar grouping, route name `/admissions`, colours, typography, patient banner layout, stepper visual style, card design, shell, facility selector. No new top-level routes; every new view lives inside the Admissions module as a tab or contextual detail.

## Out of scope
- Other modules (Ward, Theatre, Pharmacy, Billing, etc.) — only their read integrations that Admission Detail already surfaces.
- Real backend implementation. Services stay mock-backed but shaped for the API family in spec §34 so a swap is mechanical.
- Penetration testing, POPIA review, UAT, cutover rehearsal (spec §43) — those are release-gate activities outside a build turn.

## Suggested first turn after approval
Phase A + B end-to-end, so the new selector and typed service are live even before any single process is rebuilt. Then Phases C–H one turn each; Phase I closes the release-gate checklist.

Reply "go" to start Phase A + B, or tell me to reorder / drop phases.
