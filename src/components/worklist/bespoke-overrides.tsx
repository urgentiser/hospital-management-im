import type { WorkflowItem } from "@/lib/workflow-store";
import type { WorklistConfig, WorklistFilter, WorklistStatusMap, WorklistTone } from "./types";

/**
 * Bespoke, module-specific overrides for the shared `makeDefaultWorklist`.
 * Each entry contributes the columns, filters, status map, saved views and
 * summary tiles that reflect the module's business meaning. Only fields you
 * override here are used; everything else falls back to the sensible defaults.
 *
 * Keys use the module registry key. Pharmacy sub-queues are keyed as
 * `pharmacy:<sectionKey>` so the pharmacy section page can request the right
 * bespoke worklist per queue.
 */

const clinicalStatusMap: WorklistStatusMap = {
  draft: { label: "Draft", tone: "muted" },
  pending: { label: "Pending", tone: "warning" },
  submitted: { label: "Submitted", tone: "info" },
  active: { label: "In progress", tone: "primary" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "destructive" },
  review: { label: "Needs review", tone: "warning" },
};

const financialStatusMap: WorklistStatusMap = {
  draft: { label: "Draft", tone: "muted" },
  pending: { label: "Awaiting response", tone: "warning" },
  submitted: { label: "Submitted", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  partial: { label: "Partial", tone: "warning" },
  rejected: { label: "Rejected", tone: "destructive" },
  disputed: { label: "Disputed", tone: "destructive" },
  written_off: { label: "Written off", tone: "muted" },
  finalised: { label: "Finalised", tone: "success" },
};

const priorityFilter: WorklistFilter = {
  key: "priority",
  label: "Priority",
  kind: "select",
  options: [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "normal", label: "Normal" },
    { value: "low", label: "Low" },
  ],
};

const slaFilter: WorklistFilter = {
  key: "sla",
  label: "SLA",
  kind: "select",
  options: [
    { value: "on-track", label: "On track" },
    { value: "at-risk", label: "At risk" },
    { value: "breached", label: "Breached" },
  ],
};

function countBy(items: WorkflowItem[], match: (i: WorkflowItem) => boolean): number {
  return items.filter(match).length;
}

function currency(items: WorkflowItem[], key: string): string {
  const total = items.reduce((sum, i) => sum + Number(i.fields[key] ?? 0), 0);
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(total);
}

// ─── Patient care ────────────────────────────────────────────────────────

const patientMaintenance: Partial<WorklistConfig> = {
  tagline: "Patient master data across the active facility.",
  columns: [
    { key: "id", label: "MRN", sortable: true, width: "130px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true,
      render: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.title}</div>
        {r.subtitle && <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>}</div> },
    { key: "IDNumber", label: "ID / Passport",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["IDNumber"] ?? r.fields["ID"] ?? "—")}</span> },
    { key: "Funder", label: "Funder",
      render: (r) => <span className="text-xs">{String(r.fields["Funder"] ?? "Private")}</span> },
    { key: "status", label: "Status", sortable: true },
    { key: "updatedAt", label: "Updated", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending verification" },
        { value: "review", label: "Needs review" },
        { value: "cancelled", label: "Deceased/Archived" },
      ] },
    { key: "Funder", label: "Funder", kind: "text", placeholder: "e.g. Discovery" },
    { key: "created", label: "Created between", kind: "date-range" },
  ],
  savedViews: [
    { key: "unverified", label: "Awaiting verification", filters: { status: "pending" } },
    { key: "review", label: "Review flagged", filters: { status: "review" } },
    { key: "recent", label: "Created this week", filters: {} },
  ],
  summary: (items) => [
    { label: "Total patients", value: items.length, tone: "primary" },
    { label: "Awaiting verification", value: countBy(items, (i) => i.status === "pending"), tone: "warning" },
    { label: "Review flagged", value: countBy(items, (i) => i.status === "review"), tone: "destructive" },
    { label: "Active", value: countBy(items, (i) => i.status === "active"), tone: "success" },
  ],
};

const triage: Partial<WorklistConfig> = {
  tagline: "Live triage board — acuity, wait time and disposition.",
  columns: [
    { key: "id", label: "Case", sortable: true, width: "130px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true },
    { key: "ESI", label: "ESI",
      render: (r) => <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{String(r.fields["ESI"] ?? "—")}</span> },
    { key: "Complaint", label: "Chief complaint",
      render: (r) => <span className="text-xs">{String(r.fields["Complaint"] ?? "—")}</span> },
    { key: "WaitMinutes", label: "Wait", sortable: true, align: "right",
      render: (r) => <span className="text-xs font-medium">{String(r.fields["WaitMinutes"] ?? "0")}m</span> },
    { key: "status", label: "Disposition", sortable: true },
  ],
  filters: [
    { key: "ESI", label: "ESI level", kind: "select",
      options: ["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: `ESI ${v}` })) },
    { key: "status", label: "Disposition", kind: "select",
      options: [
        { value: "pending", label: "Awaiting triage" },
        { value: "active", label: "In triage" },
        { value: "completed", label: "Dispositioned" },
      ] },
  ],
  statusMap: clinicalStatusMap,
  savedViews: [
    { key: "critical", label: "ESI 1 & 2", filters: {} },
    { key: "waiting", label: "Awaiting triage", filters: { status: "pending" } },
  ],
  summary: (items) => [
    { label: "In queue", value: countBy(items, (i) => i.status === "pending"), tone: "warning" },
    { label: "In triage", value: countBy(items, (i) => i.status === "active"), tone: "primary" },
    { label: "Dispositioned today", value: countBy(items, (i) => i.status === "completed"), tone: "success" },
    { label: "Longest wait", value: `${Math.max(0, ...items.map((i) => Number(i.fields["WaitMinutes"] ?? 0)))}m`, tone: "destructive" },
  ],
};

const preadmissions: Partial<WorklistConfig> = {
  tagline: "Planned admissions — auth, funding and paperwork readiness.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "130px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true },
    { key: "AdmissionDate", label: "Admit date", sortable: true,
      render: (r) => <span className="text-xs">{String(r.fields["AdmissionDate"] ?? "—")}</span> },
    { key: "Funder", label: "Funder",
      render: (r) => <span className="text-xs">{String(r.fields["Funder"] ?? "—")}</span> },
    { key: "AuthNumber", label: "Auth #",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["AuthNumber"] ?? "—")}</span> },
    { key: "status", label: "Readiness", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "pending", label: "Awaiting funder" },
        { value: "approved", label: "Ready" },
        { value: "cancelled", label: "Cancelled" },
      ] },
    { key: "AdmissionDate", label: "Admission window", kind: "date-range" },
    { key: "Funder", label: "Funder", kind: "text" },
  ],
  savedViews: [
    { key: "next7", label: "Next 7 days", filters: {} },
    { key: "awaiting", label: "Awaiting funder", filters: { status: "pending" } },
  ],
  summary: (items) => [
    { label: "Planned this week", value: items.length, tone: "primary" },
    { label: "Awaiting funder", value: countBy(items, (i) => i.status === "pending"), tone: "warning" },
    { label: "Ready for admission", value: countBy(items, (i) => i.status === "approved"), tone: "success" },
    { label: "Cancelled", value: countBy(items, (i) => i.status === "cancelled"), tone: "destructive" },
  ],
};

const admissions: Partial<WorklistConfig> = {
  tagline: "Inpatients across active facilities — ward, LOS, funder and status.",
  columns: [
    { key: "id", label: "Admission", sortable: true, width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true,
      render: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.title}</div>
        {r.subtitle && <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>}</div> },
    { key: "Ward", label: "Ward · Bed",
      render: (r) => <span className="text-xs">{String(r.fields["Ward"] ?? "—")} · {String(r.fields["Bed"] ?? "—")}</span> },
    { key: "Funder", label: "Funder",
      render: (r) => <span className="text-xs">{String(r.fields["Funder"] ?? "Private")}</span> },
    { key: "LOS", label: "LOS", sortable: true, align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["LOS"] ?? "—")}d</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "active", label: "Admitted" },
        { value: "pending", label: "Pending admit" },
        { value: "completed", label: "Discharged" },
      ] },
    { key: "Ward", label: "Ward", kind: "text", placeholder: "e.g. Ward 3" },
    { key: "Funder", label: "Funder", kind: "text" },
    { key: "created", label: "Admitted between", kind: "date-range" },
  ],
  statusMap: clinicalStatusMap,
  savedViews: [
    { key: "admitted", label: "Currently admitted", filters: { status: "active" } },
    { key: "long-los", label: "LOS > 7 days", filters: {} },
    { key: "planned-discharge", label: "Planned discharge today", filters: {} },
  ],
  summary: (items) => [
    { label: "Admitted", value: countBy(items, (i) => i.status === "active"), tone: "primary" },
    { label: "Pending", value: countBy(items, (i) => i.status === "pending"), tone: "warning" },
    { label: "Discharged today", value: countBy(items, (i) => i.status === "completed"), tone: "success" },
    { label: "Total occupancy", value: items.length, tone: "muted" },
  ],
};

const clinicalAssessments: Partial<WorklistConfig> = {
  tagline: "Clinical assessments across departments and clinicians.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "130px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true },
    { key: "Type", label: "Assessment",
      render: (r) => <span className="text-xs">{String(r.fields["Type"] ?? "—")}</span> },
    { key: "Clinician", label: "Clinician",
      render: (r) => <span className="text-xs">{String(r.fields["Clinician"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
    { key: "updatedAt", label: "Updated", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "pending", label: "Pending review" },
        { value: "completed", label: "Completed" },
      ] },
    { key: "Type", label: "Assessment type", kind: "text" },
    { key: "Clinician", label: "Clinician", kind: "text" },
  ],
  statusMap: clinicalStatusMap,
  savedViews: [
    { key: "mine", label: "Assigned to me", filters: {} },
    { key: "pending", label: "Awaiting review", filters: { status: "pending" } },
  ],
  summary: (items) => [
    { label: "In progress", value: countBy(items, (i) => i.status === "draft"), tone: "primary" },
    { label: "Awaiting review", value: countBy(items, (i) => i.status === "pending"), tone: "warning" },
    { label: "Completed", value: countBy(items, (i) => i.status === "completed"), tone: "success" },
    { label: "Total", value: items.length, tone: "muted" },
  ],
};

const medicalEvents: Partial<WorklistConfig> = {
  tagline: "Clinical events, observations and interventions.",
  columns: [
    { key: "id", label: "Event", sortable: true, width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true },
    { key: "Kind", label: "Kind",
      render: (r) => <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px]">{String(r.fields["Kind"] ?? "—")}</span> },
    { key: "Severity", label: "Severity",
      render: (r) => <span className="text-xs">{String(r.fields["Severity"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
    { key: "updatedAt", label: "When", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "Kind", label: "Event kind", kind: "text" },
    { key: "Severity", label: "Severity", kind: "select",
      options: ["low", "moderate", "high", "critical"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
    { key: "created", label: "Occurred between", kind: "date-range" },
  ],
  savedViews: [
    { key: "critical", label: "Critical events", filters: { Severity: "critical" } },
    { key: "24h", label: "Last 24 hours", filters: {} },
  ],
};

// ─── Clinical operations ─────────────────────────────────────────────────

const ward: Partial<WorklistConfig> = {
  tagline: "Ward operations — bed status, transfers and discharges.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Bed", sortable: true },
    { key: "Ward", label: "Ward", render: (r) => <span className="text-xs">{String(r.fields["Ward"] ?? "—")}</span> },
    { key: "Kind", label: "Activity",
      render: (r) => <span className="text-xs">{String(r.fields["Kind"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "Ward", label: "Ward", kind: "text" },
    { key: "Kind", label: "Activity kind", kind: "text" },
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "active", label: "In progress" },
        { value: "completed", label: "Completed" },
      ] },
  ],
  savedViews: [
    { key: "transfers", label: "Pending transfers", filters: { Kind: "transfer" } },
    { key: "discharges", label: "Planned discharges", filters: { Kind: "discharge" } },
  ],
};

const theatre: Partial<WorklistConfig> = {
  tagline: "Theatre bookings, cases and slot utilisation.",
  columns: [
    { key: "id", label: "Booking", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Procedure", sortable: true },
    { key: "Theatre", label: "Theatre",
      render: (r) => <span className="text-xs">{String(r.fields["Theatre"] ?? "—")}</span> },
    { key: "Surgeon", label: "Surgeon",
      render: (r) => <span className="text-xs">{String(r.fields["Surgeon"] ?? "—")}</span> },
    { key: "Slot", label: "Slot",
      render: (r) => <span className="text-xs">{String(r.fields["Slot"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "Theatre", label: "Theatre", kind: "text" },
    { key: "Surgeon", label: "Surgeon", kind: "text" },
    { key: "created", label: "Slot date", kind: "date-range" },
  ],
  savedViews: [
    { key: "today", label: "Today's list", filters: {} },
    { key: "cancelled", label: "Cancellations", filters: { status: "cancelled" } },
  ],
};

const caseManagement: Partial<WorklistConfig> = {
  tagline: "Cases requiring managed care intervention.",
  columns: [
    { key: "id", label: "Case", sortable: true, width: "130px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true },
    { key: "Owner", label: "Case manager",
      render: (r) => <span className="text-xs">{String(r.fields["Owner"] ?? "Unassigned")}</span> },
    { key: "Priority", label: "Priority",
      render: (r) => <span className="text-xs">{String(r.fields["Priority"] ?? "normal")}</span> },
    { key: "status", label: "Status", sortable: true },
    { key: "updatedAt", label: "Updated", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [priorityFilter, slaFilter,
    { key: "Owner", label: "Case manager", kind: "text" }],
  savedViews: [
    { key: "mine", label: "My caseload", filters: {} },
    { key: "sla-risk", label: "SLA at risk", filters: { sla: "at-risk" } },
    { key: "unassigned", label: "Unassigned", filters: {} },
  ],
};

const clinicalCoding: Partial<WorklistConfig> = {
  tagline: "Encounters awaiting coding, review and finalisation.",
  columns: [
    { key: "id", label: "Encounter", sortable: true, width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Episode", sortable: true },
    { key: "Coder", label: "Coder",
      render: (r) => <span className="text-xs">{String(r.fields["Coder"] ?? "Unassigned")}</span> },
    { key: "ICD10", label: "Primary ICD-10",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["ICD10"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Awaiting coding" },
        { value: "review", label: "Query raised" },
        { value: "completed", label: "Finalised" },
      ] },
    { key: "Coder", label: "Coder", kind: "text" },
  ],
  savedViews: [
    { key: "awaiting", label: "Awaiting coding", filters: { status: "pending" } },
    { key: "queries", label: "Coder queries", filters: { status: "review" } },
  ],
};

// ─── Funding & revenue ───────────────────────────────────────────────────

const authorisations: Partial<WorklistConfig> = {
  tagline: "Authorisation requests and funder responses.",
  columns: [
    { key: "id", label: "Auth", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Procedure", sortable: true },
    { key: "Funder", label: "Funder",
      render: (r) => <span className="text-xs">{String(r.fields["Funder"] ?? "—")}</span> },
    { key: "AuthNumber", label: "Auth #",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["AuthNumber"] ?? "—")}</span> },
    { key: "ValidUntil", label: "Valid until", sortable: true,
      render: (r) => <span className="text-xs">{String(r.fields["ValidUntil"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Awaiting response" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "review", label: "Query raised" },
      ] },
    { key: "Funder", label: "Funder", kind: "text" },
    { key: "ValidUntil", label: "Validity", kind: "date-range" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "awaiting", label: "Awaiting funder", filters: { status: "pending" } },
    { key: "expiring", label: "Expiring in 3 days", filters: {} },
    { key: "rejected", label: "Rejected", filters: { status: "rejected" } },
  ],
  summary: (items) => [
    { label: "Awaiting", value: countBy(items, (i) => i.status === "pending"), tone: "warning" },
    { label: "Approved", value: countBy(items, (i) => i.status === "approved"), tone: "success" },
    { label: "Rejected", value: countBy(items, (i) => i.status === "rejected"), tone: "destructive" },
    { label: "Total", value: items.length, tone: "muted" },
  ],
};

const funding: Partial<WorklistConfig> = {
  tagline: "Funding requests and cover confirmations.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Funder", sortable: true },
    { key: "MemberNumber", label: "Member #",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["MemberNumber"] ?? "—")}</span> },
    { key: "Amount", label: "Amount", align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["Amount"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Confirmed" },
        { value: "rejected", label: "Declined" },
      ] },
    { key: "Funder", label: "Funder", kind: "text" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "pending", label: "Pending confirmation", filters: { status: "pending" } },
    { key: "declined", label: "Declined", filters: { status: "rejected" } },
  ],
};

const billing: Partial<WorklistConfig> = {
  tagline: "Invoice preparation, finalisation and dispatch.",
  columns: [
    { key: "id", label: "Invoice", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Episode", sortable: true },
    { key: "Amount", label: "Amount", sortable: true, align: "right",
      render: (r) => <span className="text-xs">R {Number(r.fields["Amount"] ?? 0).toLocaleString("en-ZA")}</span> },
    { key: "Funder", label: "Funder",
      render: (r) => <span className="text-xs">{String(r.fields["Funder"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
    { key: "updatedAt", label: "Updated", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Submitted" },
        { value: "finalised", label: "Finalised" },
        { value: "disputed", label: "Disputed" },
      ] },
    { key: "Funder", label: "Funder", kind: "text" },
    { key: "created", label: "Invoice date", kind: "date-range" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "draft", label: "Draft invoices", filters: { status: "draft" } },
    { key: "disputed", label: "Disputed", filters: { status: "disputed" } },
    { key: "ready", label: "Ready to submit", filters: {} },
  ],
  summary: (items) => [
    { label: "Draft", value: countBy(items, (i) => i.status === "draft"), tone: "muted" },
    { label: "Submitted", value: countBy(items, (i) => i.status === "submitted"), tone: "primary" },
    { label: "Disputed", value: countBy(items, (i) => i.status === "disputed"), tone: "destructive" },
    { label: "Billed total", value: currency(items, "Amount"), tone: "success" },
  ],
};

const claims: Partial<WorklistConfig> = {
  tagline: "Claims lifecycle — submission, remittance and disputes.",
  columns: [
    { key: "id", label: "Claim", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Funder", sortable: true },
    { key: "Amount", label: "Claimed", sortable: true, align: "right",
      render: (r) => <span className="text-xs">R {Number(r.fields["Amount"] ?? 0).toLocaleString("en-ZA")}</span> },
    { key: "PaidAmount", label: "Paid", align: "right",
      render: (r) => <span className="text-xs">R {Number(r.fields["PaidAmount"] ?? 0).toLocaleString("en-ZA")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "submitted", label: "Submitted" },
        { value: "approved", label: "Approved" },
        { value: "partial", label: "Part-paid" },
        { value: "rejected", label: "Rejected" },
        { value: "disputed", label: "Disputed" },
      ] },
    { key: "Funder", label: "Funder", kind: "text" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "outstanding", label: "Outstanding", filters: {} },
    { key: "rejected", label: "Rejected", filters: { status: "rejected" } },
    { key: "disputed", label: "Disputed", filters: { status: "disputed" } },
  ],
  summary: (items) => [
    { label: "Submitted", value: countBy(items, (i) => i.status === "submitted"), tone: "primary" },
    { label: "Part-paid", value: countBy(items, (i) => i.status === "partial"), tone: "warning" },
    { label: "Rejected", value: countBy(items, (i) => i.status === "rejected"), tone: "destructive" },
    { label: "Claimed total", value: currency(items, "Amount"), tone: "success" },
  ],
};

const accounting: Partial<WorklistConfig> = {
  tagline: "Postings, receipts and reconciliations.",
  columns: [
    { key: "id", label: "Entry", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Reference", sortable: true },
    { key: "Kind", label: "Kind",
      render: (r) => <span className="text-xs">{String(r.fields["Kind"] ?? "—")}</span> },
    { key: "Amount", label: "Amount", sortable: true, align: "right",
      render: (r) => <span className="text-xs">R {Number(r.fields["Amount"] ?? 0).toLocaleString("en-ZA")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "Kind", label: "Entry kind", kind: "text" },
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Pending posting" },
        { value: "completed", label: "Posted" },
        { value: "review", label: "In query" },
      ] },
    { key: "created", label: "Period", kind: "date-range" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "unposted", label: "Unposted", filters: { status: "pending" } },
    { key: "queries", label: "Queries", filters: { status: "review" } },
  ],
};

const coid: Partial<WorklistConfig> = {
  tagline: "COID/IOD claims, incidents and settlements.",
  columns: [
    { key: "id", label: "COID ref", sortable: true, width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Employer", sortable: true },
    { key: "InjuryDate", label: "Injury date", sortable: true,
      render: (r) => <span className="text-xs">{String(r.fields["InjuryDate"] ?? "—")}</span> },
    { key: "Employer", label: "Employer",
      render: (r) => <span className="text-xs">{String(r.fields["Employer"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "submitted", label: "Submitted" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "review", label: "Query raised" },
      ] },
    { key: "Employer", label: "Employer", kind: "text" },
    { key: "InjuryDate", label: "Injury window", kind: "date-range" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "queries", label: "Queries", filters: { status: "review" } },
    { key: "unsettled", label: "Unsettled", filters: {} },
  ],
};

const reimbursements: Partial<WorklistConfig> = {
  tagline: "Refunds and credit notes to patients or funders.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Beneficiary", sortable: true },
    { key: "Amount", label: "Amount", sortable: true, align: "right",
      render: (r) => <span className="text-xs">R {Number(r.fields["Amount"] ?? 0).toLocaleString("en-ZA")}</span> },
    { key: "Reason", label: "Reason",
      render: (r) => <span className="text-xs">{String(r.fields["Reason"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Awaiting approval" },
        { value: "approved", label: "Approved" },
        { value: "paid", label: "Paid" },
        { value: "rejected", label: "Rejected" },
      ] },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "approve", label: "Awaiting approval", filters: { status: "pending" } },
    { key: "paid-today", label: "Paid today", filters: { status: "paid" } },
  ],
};

const supplierInvoices: Partial<WorklistConfig> = {
  tagline: "Supplier invoices, matching and payment scheduling.",
  columns: [
    { key: "id", label: "Invoice", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Supplier", sortable: true },
    { key: "PONumber", label: "PO",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["PONumber"] ?? "—")}</span> },
    { key: "Amount", label: "Amount", sortable: true, align: "right",
      render: (r) => <span className="text-xs">R {Number(r.fields["Amount"] ?? 0).toLocaleString("en-ZA")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Awaiting match" },
        { value: "approved", label: "Approved" },
        { value: "paid", label: "Paid" },
        { value: "disputed", label: "Disputed" },
      ] },
    { key: "created", label: "Received", kind: "date-range" },
  ],
  statusMap: financialStatusMap,
  savedViews: [
    { key: "unmatched", label: "Awaiting match", filters: { status: "pending" } },
    { key: "disputed", label: "Disputed", filters: { status: "disputed" } },
  ],
};

const accountEnquiries: Partial<WorklistConfig> = {
  tagline: "Patient/member account queries and resolutions.",
  columns: [
    { key: "id", label: "Enquiry", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient · Query", sortable: true },
    { key: "Owner", label: "Owner",
      render: (r) => <span className="text-xs">{String(r.fields["Owner"] ?? "Unassigned")}</span> },
    { key: "Priority", label: "Priority",
      render: (r) => <span className="text-xs">{String(r.fields["Priority"] ?? "normal")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [priorityFilter, slaFilter,
    { key: "Owner", label: "Owner", kind: "text" }],
  savedViews: [
    { key: "mine", label: "My queue", filters: {} },
    { key: "breached", label: "SLA breached", filters: { sla: "breached" } },
  ],
};

// ─── Organisation ────────────────────────────────────────────────────────

const facilities: Partial<WorklistConfig> = {
  tagline: "Facilities, wards, bed capacity and configuration.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Facility", sortable: true },
    { key: "Beds", label: "Beds", align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["Beds"] ?? "—")}</span> },
    { key: "Wards", label: "Wards", align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["Wards"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "active", label: "Active" },
        { value: "cancelled", label: "Archived" },
      ] },
  ],
};

const practitioners: Partial<WorklistConfig> = {
  tagline: "Practitioner directory, HPCSA/BHF numbers, disciplines.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Practitioner", sortable: true },
    { key: "Discipline", label: "Discipline",
      render: (r) => <span className="text-xs">{String(r.fields["Discipline"] ?? "—")}</span> },
    { key: "HPCSA", label: "HPCSA",
      render: (r) => <span className="font-mono text-xs">{String(r.fields["HPCSA"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "Discipline", label: "Discipline", kind: "text" },
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "cancelled", label: "Inactive" },
      ] },
  ],
};

const workflowInbox: Partial<WorklistConfig> = {
  tagline: "Cross-module tasks assigned to you or your team.",
  columns: [
    { key: "id", label: "Task", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Subject", sortable: true },
    { key: "Kind", label: "From module",
      render: (r) => <span className="text-xs">{String(r.fields["Kind"] ?? "—")}</span> },
    { key: "Owner", label: "Assignee",
      render: (r) => <span className="text-xs">{String(r.fields["Owner"] ?? "—")}</span> },
    { key: "Priority", label: "Priority",
      render: (r) => <span className="text-xs">{String(r.fields["Priority"] ?? "normal")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [priorityFilter, slaFilter,
    { key: "Owner", label: "Assignee", kind: "text" },
    { key: "Kind", label: "Source module", kind: "text" }],
  savedViews: [
    { key: "mine", label: "Assigned to me", filters: {} },
    { key: "unassigned", label: "Unassigned", filters: {} },
    { key: "sla-risk", label: "SLA at risk", filters: { sla: "at-risk" } },
  ],
};

// ─── Platform ────────────────────────────────────────────────────────────

const integrations: Partial<WorklistConfig> = {
  tagline: "External integrations, retries and replays.",
  columns: [
    { key: "id", label: "Message", sortable: true, width: "160px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Route · Topic", sortable: true },
    { key: "Attempts", label: "Attempts", align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["Attempts"] ?? "1")}</span> },
    { key: "status", label: "Status", sortable: true },
    { key: "updatedAt", label: "Last try", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Retrying" },
        { value: "completed", label: "Delivered" },
        { value: "failed", label: "Failed" },
      ] },
    { key: "Route", label: "Route", kind: "text" },
  ],
  savedViews: [
    { key: "failed", label: "Failing now", filters: { status: "failed" } },
    { key: "retrying", label: "Retrying", filters: { status: "pending" } },
  ],
};

const failedMessages: Partial<WorklistConfig> = {
  tagline: "Dead-letter queue — inspect, replay or discard.",
  columns: [
    { key: "id", label: "Message", sortable: true, width: "160px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Topic · Failure", sortable: true },
    { key: "Category", label: "Category",
      render: (r) => <span className="text-xs">{String(r.fields["Category"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "Category", label: "Category", kind: "select",
      options: ["Schema", "Downstream", "Poison", "Config"].map((v) => ({ value: v, label: v })) },
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "pending", label: "Awaiting triage" },
        { value: "completed", label: "Replayed" },
        { value: "cancelled", label: "Discarded" },
      ] },
  ],
};

const serviceBus: Partial<WorklistConfig> = {
  tagline: "Bus topics, subscriptions and message flow.",
  columns: [
    { key: "id", label: "Topic", sortable: true, width: "160px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Subscription", sortable: true },
    { key: "Backlog", label: "Backlog", align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["Backlog"] ?? "0")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "review", label: "Backlog rising" },
        { value: "failed", label: "Stalled" },
      ] },
  ],
};

const auditTrail: Partial<WorklistConfig> = {
  tagline: "Immutable log of platform actions and access.",
  columns: [
    { key: "id", label: "Entry", sortable: true, width: "170px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Actor · Action", sortable: true },
    { key: "Module", label: "Module",
      render: (r) => <span className="text-xs">{String(r.fields["Module"] ?? "—")}</span> },
    { key: "updatedAt", label: "When", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "Module", label: "Module", kind: "text" },
    { key: "Actor", label: "Actor", kind: "text" },
    { key: "created", label: "When", kind: "date-range" },
  ],
  savedViews: [
    { key: "admin-actions", label: "Admin actions today", filters: {} },
    { key: "sensitive", label: "Sensitive operations", filters: {} },
  ],
};

const notifications: Partial<WorklistConfig> = {
  tagline: "Broadcast and per-user notifications.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Subject", sortable: true },
    { key: "Channel", label: "Channel",
      render: (r) => <span className="text-xs">{String(r.fields["Channel"] ?? "in-app")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Sent" },
        { value: "failed", label: "Failed" },
      ] },
    { key: "Channel", label: "Channel", kind: "select",
      options: ["email", "sms", "in-app", "push"].map((v) => ({ value: v, label: v.toUpperCase() })) },
  ],
};

const systemHealth: Partial<WorklistConfig> = {
  tagline: "Service health, incidents and probes.",
  columns: [
    { key: "id", label: "Probe", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Service", sortable: true },
    { key: "LatencyMs", label: "Latency", align: "right",
      render: (r) => <span className="text-xs">{String(r.fields["LatencyMs"] ?? "—")}ms</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "active", label: "Healthy" },
        { value: "review", label: "Degraded" },
        { value: "failed", label: "Down" },
      ] },
  ],
  statusMap: {
    active: { label: "Healthy", tone: "success" as WorklistTone },
    review: { label: "Degraded", tone: "warning" as WorklistTone },
    failed: { label: "Down", tone: "destructive" as WorklistTone },
  },
};

// ─── Admin subsections (worklists on Admin sub-routes) ───────────────────

const adminUsers: Partial<WorklistConfig> = {
  tagline: "User accounts, roles and access requests.",
  columns: [
    { key: "id", label: "Ref", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "User", sortable: true },
    { key: "Role", label: "Role",
      render: (r) => <span className="text-xs">{String(r.fields["Role"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending invite" },
        { value: "cancelled", label: "Disabled" },
      ] },
    { key: "Role", label: "Role", kind: "text" },
  ],
};

// ─── Pharmacy sub-queues ─────────────────────────────────────────────────

function pharmacyQueue(label: string, tagline: string, extraFilters: WorklistFilter[] = []): Partial<WorklistConfig> {
  return {
    tagline,
    columns: [
      { key: "id", label: "Ref", sortable: true, width: "140px",
        render: (r) => <span className="font-mono text-xs">{r.id}</span> },
      { key: "title", label: `${label} · Patient`, sortable: true },
      { key: "Kind", label: "Item",
        render: (r) => <span className="text-xs">{String(r.fields["Kind"] ?? "—")}</span> },
      { key: "Qty", label: "Qty", align: "right",
        render: (r) => <span className="text-xs">{String(r.fields["Qty"] ?? "—")}</span> },
      { key: "status", label: "Status", sortable: true },
      { key: "updatedAt", label: "Updated", sortable: true,
        render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt).toLocaleString("en-ZA")}</span> },
    ],
    filters: [
      { key: "status", label: "Status", kind: "select",
        options: [
          { value: "pending", label: "Pending" },
          { value: "active", label: "In progress" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ] },
      ...extraFilters,
    ],
  };
}

const pharmacyDispensing = pharmacyQueue(
  "Dispense",
  "Prescriptions ready for dispensing.",
  [{ key: "Prescriber", label: "Prescriber", kind: "text" }],
);
const pharmacyToFollows = pharmacyQueue(
  "To-follow",
  "Deferred dispenses awaiting stock or clarification.",
);
const pharmacyRepeats = pharmacyQueue(
  "Repeat",
  "Repeat prescription queue.",
  [{ key: "NextDue", label: "Next due", kind: "date-range" }],
);
const pharmacyEnquiry: Partial<WorklistConfig> = {
  tagline: "Read-only stock, prescription and drug enquiries.",
  columns: [
    { key: "id", label: "Query", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Subject", sortable: true },
    { key: "Kind", label: "Kind",
      render: (r) => <span className="text-xs">{String(r.fields["Kind"] ?? "—")}</span> },
    { key: "status", label: "Status", sortable: true },
  ],
  filters: [{ key: "Kind", label: "Enquiry kind", kind: "text" }],
};
const pharmacyCompounding = pharmacyQueue(
  "Compound",
  "Compounding queue — sterile and non-sterile preparations.",
  [{ key: "Formula", label: "Formula", kind: "text" }],
);
const pharmacyLabelsStock = pharmacyQueue(
  "Labels & stock",
  "Label reprints, stock adjustments and cycle counts.",
);
const pharmacyWardTheatre = pharmacyQueue(
  "Ward/Theatre",
  "Ward and theatre supply requests.",
  [{ key: "Location", label: "Ward / Theatre", kind: "text" }],
);
const pharmacyRetailAccounts = pharmacyQueue(
  "Retail",
  "Retail account transactions and settlements.",
);
const pharmacyBusinessFlow = pharmacyQueue(
  "Case",
  "End-to-end pharmacy cases across queues.",
);

// ─── Registry ────────────────────────────────────────────────────────────

const overrides: Record<string, Partial<WorklistConfig>> = {
  "patients": patientMaintenance,
  "patient-maintenance": patientMaintenance,
  "triage": triage,
  "preadmissions": preadmissions,
  "preadmission": preadmissions,
  "admissions": admissions,
  "clinical-assessments": clinicalAssessments,
  "clinical-assessment": clinicalAssessments,
  "medical-events": medicalEvents,
  "ward": ward,
  "ward-management": ward,
  "theatre": theatre,
  "theatre-management": theatre,
  "case-management": caseManagement,
  "clinical-coding": clinicalCoding,
  "authorisations": authorisations,
  "funding": funding,
  "billing": billing,
  "claims": claims,
  "accounting": accounting,
  "coid": coid,
  "reimbursements": reimbursements,
  "supplier-invoices": supplierInvoices,
  "account-enquiries": accountEnquiries,
  "facilities": facilities,
  "practitioners": practitioners,
  "workflow-inbox": workflowInbox,
  "integrations": integrations,
  "failed-messages": failedMessages,
  "service-bus": serviceBus,
  "audit": auditTrail,
  "audit-trail": auditTrail,
  "notifications": notifications,
  "system-health": systemHealth,
  "admin:users": adminUsers,
  "pharmacy:dispensing": pharmacyDispensing,
  "pharmacy:to-follows": pharmacyToFollows,
  "pharmacy:repeats": pharmacyRepeats,
  "pharmacy:enquiry": pharmacyEnquiry,
  "pharmacy:compounding": pharmacyCompounding,
  "pharmacy:labels-stock": pharmacyLabelsStock,
  "pharmacy:ward-theatre": pharmacyWardTheatre,
  "pharmacy:retail-accounts": pharmacyRetailAccounts,
  "pharmacy:business-flow": pharmacyBusinessFlow,
};

/**
 * Returns the bespoke overrides for a module (or pharmacy sub-queue) if one is
 * registered. Callers pass either the plain module key or `moduleKey:subKey`.
 */
export function getBespokeOverrides(key: string): Partial<WorklistConfig> | undefined {
  return overrides[key];
}
