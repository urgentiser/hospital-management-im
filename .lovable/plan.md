## Goal

Elevate the existing Impilo Modern Platform frontend to a premium, enterprise-grade healthcare experience — without changing brand colours, routes, business rules, mock data, or functionality. Purely a design-system and shell refinement pass, applied consistently across every module.

## Non-negotiables (locked)

- Preserve existing colour palette, gradients, logo, brand identity (tokens in `src/styles.css` untouched semantically).
- No route removed, no module removed, no business rule altered.
- PCMS stays external (sidebar link only, no rebuild).
- All existing mock data, workflow store, and business-flow wizards remain functional.

## Scope (in order)

### Phase A — Foundations (shared components, cascades everywhere)

1. **`src/components/app-shell.tsx`** — premium shell
   - Collapsible sidebar with grouped nav sections (already present, refine spacing, typography, dividers, active-state rail indicator, group headers).
   - Top bar: global search, facility selector (new), patient context chip (new, shows when a patient route is active), notification bell w/ unread dot, environment indicator ("Demo/Prod"), system-health dot, user menu.
   - Breadcrumbs slot beneath top bar for section pages.
   - Consistent 64px header, refined shadows, calmer borders.

2. **`src/components/app-shell.tsx` — `PageHeader`, `Card`, `StatusChip`** refined
   - Tighter type scale, consistent 24px section rhythm, eyebrow → title → description → actions.
   - StatusChip: unify all module statuses (delivered/pending/failed/etc.) into one map with dot + label + subtle bg.
   - Card variants: `elevated`, `flat`, `interactive`.

3. **New shared primitives** (small additions, no new deps):
   - `src/components/ui-kit/kpi-card.tsx` — icon + label + value + delta + accent bar
   - `src/components/ui-kit/patient-banner.tsx` — persistent banner shown on patient-scoped routes (name, MRN, DOB/age/sex, facility, admission, ward/bed, funding, allergies pill, alerts)
   - `src/components/ui-kit/data-table-shell.tsx` — table chrome: toolbar (search, filter chips, column visibility, export), sticky header, row hover, empty/loading/error states
   - `src/components/ui-kit/section.tsx` — titled section wrapper with description + actions
   - `src/components/ui-kit/timeline.tsx` — event timeline (reused by audit, admissions, authorisations, service bus)
   - `src/components/ui-kit/empty-state.tsx`, `error-state.tsx`, `skeleton-table.tsx`
   - `src/lib/format.ts` — `formatZAR`, `formatDateZA` (dd/MM/yyyy), `formatDateTimeZA` — used across tables

### Phase B — Dashboard (`src/routes/_app.index.tsx`)

Rebuild as an operations command centre using the new primitives:
- Top row: 4 executive KPIs (Admissions today, Pending Authorisations, Theatre Utilisation, Failed Messages)
- Second row: Ward Occupancy card, Pharmacy Activity card, Billing/Funding snapshot, Case Management alerts
- Third row: Service Bus health mini-panel, Recent patient activity feed, SLA breaches list
- Every card has drill-through link to its module.

### Phase C — Module chrome pass (consistent look, no logic change)

Sweep every route file in `src/routes/_app.*.tsx` and swap raw markup for the new primitives. This is mechanical:
- Wrap page in `<PageHeader />` + breadcrumb
- Replace ad-hoc kpi divs with `<KpiCard />`
- Replace ad-hoc tables with `<DataTableShell />` (keeps existing row rendering)
- Add empty/loading states everywhere they're missing
- Standardise section spacing to `space-y-6`

Priority order (highest value first):
1. Patient Maintenance, Admissions, Preadmissions, Triage, Clinical Assessments, Medical Events, Documents
2. Ward, Theatre, Pharmacy, Case Management, Clinical Coding
3. Authorisations, Funding, Billing, Accounting, COID, Reimbursements, Supplier Invoices, Account Enquiries, AdHoc
4. Facilities, Practitioners, Workflow Inbox, MyLife Portal
5. Integrations, Service Bus, Failed Messages, Audit, Notifications, System Health
6. Admin/* pages

### Phase D — Business-flow wizard refinements (`src/components/business-flow.tsx`, `module-console.tsx`)

Already improved earlier — this pass:
- Tighten stepper pill sizing, ensure wrap on narrow widths
- Consistent field grid (2-col on ≥sm)
- Sticky action bar (Back / Save Draft / Continue)
- Confirmation dialogs on destructive actions (already wired via `AlertDialog`)

### Phase E — Patient context

- Add `src/lib/patient-context.ts` (zustand) — currently-selected patient
- Selector in top bar; banner auto-shows on `/patients/*`, `/admissions/*`, `/triage`, `/clinical-assessments`, `/medical-events`, `/pharmacy/dispensing`, `/case-management`, `/authorisations`, `/billing`
- Uses existing mock patients from `src/lib/mock-data.ts`

### Phase F — Accessibility & interactions polish

- Focus rings on all interactive elements (`focus-visible:ring-2 ring-primary/40 ring-offset-2 ring-offset-background`)
- `aria-label` on every icon-only button (sidebar toggles, top-bar actions, table row menus)
- `<main>` singleton in shell, semantic `<nav>` groups with `aria-labelledby`
- Respect `prefers-reduced-motion` — motion utilities already OK, just add `motion-reduce:transition-none` where relevant

## Out of scope

- No new business logic, no schema, no backend changes.
- No new routes, no route deletions.
- No colour token changes (palette locked).
- No PCMS internalisation.

## Technical notes

- Colours: keep using existing tokens (`bg-primary`, `text-muted-foreground`, `bg-gradient-primary`, `shadow-glow`, `bg-gradient-surface`) — do NOT hardcode hex/tailwind arbitrary colours.
- Currency: `Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" })`.
- Dates: `Intl.DateTimeFormat("en-ZA")` → dd/MM/yyyy.
- Tables retain existing data shapes; only chrome changes.
- Workflow store (`src/lib/workflow-store.ts`) untouched.

## Deliverable cadence

Given the size, I'll ship in this order and stop for your review after each phase:
1. Phase A + B (shell + dashboard) — biggest visual impact, sets the pattern.
2. Phase C batch 1 (Patient Care modules).
3. Phase C batch 2 (Clinical Ops).
4. Phase C batch 3 (Funding & Revenue).
5. Phase C batch 4 (Organisation + Platform Ops + Admin).
6. Phase D–F polish.

Reply "go" to start with Phase A + B, or tell me which phase to prioritise / skip.
