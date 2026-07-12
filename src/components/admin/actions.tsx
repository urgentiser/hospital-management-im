import { useState } from "react";
import { toast } from "sonner";
import {
  Hash, FileCog, Building2, Scissors, BedDouble, CalendarClock, ToggleRight,
  FileBarChart, AlertTriangle, Receipt, Hospital, Server, Printer, LayoutTemplate,
  UserCog, UserCheck, ShieldAlert, Workflow, Radio, MapPinned, RefreshCw,
  Ban, FileCheck2, LockOpen, KeyRound, Eraser, Search, Users, Building, Database,
  Wallet, PrinterCheck, LineChart, ShieldQuestion, FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useWorkflow } from "@/lib/workflow-store";

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export type ActionKey =
  | "shortCodes" | "docConfig" | "editFacilities" | "editTheatre" | "editWard"
  | "eventSummary" | "featureToggle" | "guarantorStatements" | "integrationErrors"
  | "invoicesStatements" | "maintainHospital" | "maintainPrintServers" | "maintainPrinters"
  | "maintainTemplates" | "maintainUser" | "manageApprovers" | "manageCoid"
  | "manageWorkflow" | "pingFacility" | "provincialStatements" | "replayBillJob"
  | "sanctionPractitioner" | "submitCaseOwners" | "unlockMe" | "unlockResources"
  | "userLogsClear" | "userLogsQuery" | "userRightsQuery" | "viewAuthMessage";

export type ActionSpec = {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: string;
  startStatus: string;
  hint: string;
  fields: FieldSpec[];
  destructive?: boolean;
};

const CODE_FIELDS: FieldSpec[] = [
  { name: "code", label: "Code", required: true, placeholder: "e.g. WARD-ICU" },
  { name: "description", label: "Description", required: true },
  { name: "category", label: "Category", placeholder: "e.g. Ward / Room / Billing" },
];
const FACILITY_FIELDS: FieldSpec[] = [
  { name: "facility", label: "Facility name", required: true },
  { name: "code", label: "Facility code", placeholder: "e.g. IMP-JHB-001" },
  { name: "province", label: "Province", placeholder: "e.g. Gauteng" },
  { name: "notes", label: "Notes", type: "textarea" },
];
const THEATRE_FIELDS: FieldSpec[] = [
  { name: "facility", label: "Facility", required: true },
  { name: "theatre", label: "Theatre name", required: true, placeholder: "e.g. Theatre 2" },
  { name: "capacity", label: "Concurrent cases", type: "number", placeholder: "1" },
];
const WARD_FIELDS: FieldSpec[] = [
  { name: "facility", label: "Facility", required: true },
  { name: "ward", label: "Ward name", required: true, placeholder: "e.g. Ward 3B" },
  { name: "beds", label: "Beds", type: "number", placeholder: "20" },
];
const USER_FIELDS: FieldSpec[] = [
  { name: "name", label: "Full name", required: true },
  { name: "email", label: "Email", required: true },
  { name: "role", label: "Role", required: true, placeholder: "Clinical Lead / Case Manager / Billing / Admin" },
  { name: "facility", label: "Facility", placeholder: "Optional" },
];
const TEMPLATE_FIELDS: FieldSpec[] = [
  { name: "name", label: "Template name", required: true },
  { name: "type", label: "Type", placeholder: "Letter / Invoice / Statement" },
  { name: "notes", label: "Notes", type: "textarea" },
];
const PRINTER_FIELDS: FieldSpec[] = [
  { name: "name", label: "Printer name", required: true },
  { name: "location", label: "Location", placeholder: "Ward / Reception" },
  { name: "server", label: "Print server", placeholder: "e.g. PRTSVR-01" },
];
const APPROVER_FIELDS: FieldSpec[] = [
  { name: "name", label: "Approver name", required: true },
  { name: "scope", label: "Approval scope", required: true, placeholder: "Auth / Billing / Discharge" },
  { name: "threshold", label: "Threshold (R)", type: "number" },
];
const WORKFLOW_FIELDS: FieldSpec[] = [
  { name: "workflow", label: "Workflow", required: true, placeholder: "e.g. Pre-Auth Approval" },
  { name: "steps", label: "Steps", type: "textarea", placeholder: "Intake → Review → Approve …" },
];
const STATEMENT_FIELDS: FieldSpec[] = [
  { name: "party", label: "Guarantor / Payer", required: true },
  { name: "period", label: "Period", placeholder: "e.g. 2026-06" },
  { name: "reference", label: "Reference" },
];
const TOGGLE_FIELDS: FieldSpec[] = [
  { name: "flag", label: "Feature flag", required: true, placeholder: "e.g. beta.newBilling" },
  { name: "state", label: "State", required: true, placeholder: "on / off" },
  { name: "audience", label: "Audience", placeholder: "All / Facility X / Role" },
];
const EVENT_FIELDS: FieldSpec[] = [
  { name: "period", label: "Period", required: true, placeholder: "e.g. 2026-07" },
  { name: "scope", label: "Scope", placeholder: "Facility / Module" },
];
const INTEGRATION_FIELDS: FieldSpec[] = [
  { name: "system", label: "System", required: true, placeholder: "e.g. Discovery, MedScheme" },
  { name: "since", label: "Since", placeholder: "YYYY-MM-DD" },
];
const PING_FIELDS: FieldSpec[] = [
  { name: "facility", label: "Facility", required: true },
  { name: "reason", label: "Reason", placeholder: "Optional" },
];
const REPLAY_FIELDS: FieldSpec[] = [
  { name: "jobRef", label: "Bill job reference", required: true, placeholder: "e.g. BJ-40021" },
  { name: "reason", label: "Reason", type: "textarea" },
];
const SANCTION_FIELDS: FieldSpec[] = [
  { name: "practitioner", label: "Practitioner", required: true },
  { name: "hpcsa", label: "HPCSA #", placeholder: "e.g. MP0123456" },
  { name: "reason", label: "Sanction reason", required: true, type: "textarea" },
];
const CASE_OWNER_FIELDS: FieldSpec[] = [
  { name: "period", label: "Period", required: true, placeholder: "e.g. 2026-07" },
  { name: "count", label: "Cases", type: "number", placeholder: "0" },
];
const UNLOCK_FIELDS: FieldSpec[] = [
  { name: "resource", label: "Resource", required: true, placeholder: "Patient / Invoice / Auth ID" },
  { name: "reason", label: "Reason", required: true },
];
const LOG_FIELDS: FieldSpec[] = [
  { name: "user", label: "User", required: true },
  { name: "from", label: "From", placeholder: "YYYY-MM-DD" },
  { name: "to", label: "To", placeholder: "YYYY-MM-DD" },
];

export const ACTIONS: Record<ActionKey, ActionSpec> = {
  shortCodes: { key: "shortCodes", label: "Maintain Short Codes", icon: Hash, kind: "Short Codes", startStatus: "active", hint: "Reference short codes used across the platform", fields: CODE_FIELDS },
  docConfig: { key: "docConfig", label: "Document Configuration", icon: FileCog, kind: "Doc Config", startStatus: "active", hint: "Configure document types and numbering", fields: TEMPLATE_FIELDS },
  editFacilities: { key: "editFacilities", label: "Edit Facilities", icon: Building2, kind: "Facility", startStatus: "active", hint: "Maintain facility details", fields: FACILITY_FIELDS },
  editTheatre: { key: "editTheatre", label: "Edit Theatre", icon: Scissors, kind: "Theatre", startStatus: "active", hint: "Add or edit theatres", fields: THEATRE_FIELDS },
  editWard: { key: "editWard", label: "Edit Ward", icon: BedDouble, kind: "Ward", startStatus: "active", hint: "Add or edit wards", fields: WARD_FIELDS },
  eventSummary: { key: "eventSummary", label: "Event Summary", icon: CalendarClock, kind: "Event Summary", startStatus: "active", hint: "Summary of platform events", fields: EVENT_FIELDS },
  featureToggle: { key: "featureToggle", label: "Feature Toggle", icon: ToggleRight, kind: "Feature Toggle", startStatus: "active", hint: "Enable/disable features", fields: TOGGLE_FIELDS },
  guarantorStatements: { key: "guarantorStatements", label: "Guarantor Statements", icon: FileBarChart, kind: "Guarantor Statement", startStatus: "active", hint: "Generate guarantor statements", fields: STATEMENT_FIELDS },
  integrationErrors: { key: "integrationErrors", label: "Integration Errors", icon: AlertTriangle, kind: "Integration Errors", startStatus: "active", hint: "Review external integration failures", fields: INTEGRATION_FIELDS },
  invoicesStatements: { key: "invoicesStatements", label: "Invoices & Statements", icon: Receipt, kind: "Invoices & Statements", startStatus: "active", hint: "Reprint or review invoices and statements", fields: STATEMENT_FIELDS },
  maintainHospital: { key: "maintainHospital", label: "Maintain Hospital", icon: Hospital, kind: "Hospital", startStatus: "active", hint: "Hospital-level configuration", fields: FACILITY_FIELDS },
  maintainPrintServers: { key: "maintainPrintServers", label: "Maintain Print Servers", icon: Server, kind: "Print Server", startStatus: "active", hint: "Configure print servers", fields: [{ name: "name", label: "Server name", required: true }, { name: "host", label: "Host", required: true }] },
  maintainPrinters: { key: "maintainPrinters", label: "Maintain Printers", icon: Printer, kind: "Printer", startStatus: "active", hint: "Configure printers", fields: PRINTER_FIELDS },
  maintainTemplates: { key: "maintainTemplates", label: "Maintain Templates", icon: LayoutTemplate, kind: "Template", startStatus: "active", hint: "Manage document templates", fields: TEMPLATE_FIELDS },
  maintainUser: { key: "maintainUser", label: "Maintain User", icon: UserCog, kind: "User", startStatus: "active", hint: "Invite or edit users", fields: USER_FIELDS },
  manageApprovers: { key: "manageApprovers", label: "Manage Approvers", icon: UserCheck, kind: "Approvers", startStatus: "active", hint: "Set approvers and thresholds", fields: APPROVER_FIELDS },
  manageCoid: { key: "manageCoid", label: "Manage COID Claims", icon: ShieldAlert, kind: "COID Admin", startStatus: "active", hint: "COID configuration and overrides", fields: [{ name: "employer", label: "Employer", required: true }, { name: "notes", label: "Notes", type: "textarea" }] },
  manageWorkflow: { key: "manageWorkflow", label: "Manage Workflow", icon: Workflow, kind: "Workflow", startStatus: "active", hint: "Configure workflow steps", fields: WORKFLOW_FIELDS },
  pingFacility: { key: "pingFacility", label: "Ping Facility", icon: Radio, kind: "Facility Ping", startStatus: "active", hint: "Test connectivity to a facility", fields: PING_FIELDS },
  provincialStatements: { key: "provincialStatements", label: "Provincial Statements", icon: MapPinned, kind: "Provincial Statement", startStatus: "active", hint: "Provincial billing statements", fields: STATEMENT_FIELDS },
  replayBillJob: { key: "replayBillJob", label: "Replay BillJob", icon: RefreshCw, kind: "Replay BillJob", startStatus: "active", hint: "Re-run a failed billing job", fields: REPLAY_FIELDS },
  sanctionPractitioner: { key: "sanctionPractitioner", label: "Sanction Practitioner", icon: Ban, kind: "Sanction", startStatus: "suspended", hint: "Restrict a practitioner", fields: SANCTION_FIELDS, destructive: true },
  submitCaseOwners: { key: "submitCaseOwners", label: "Submit Case Owners", icon: FileCheck2, kind: "Case Owners", startStatus: "active", hint: "Submit case ownership assignments", fields: CASE_OWNER_FIELDS },
  unlockMe: { key: "unlockMe", label: "Unlock Me", icon: LockOpen, kind: "Unlock Me", startStatus: "active", hint: "Release your own locked resources", fields: [{ name: "reason", label: "Reason", placeholder: "Optional" }] },
  unlockResources: { key: "unlockResources", label: "Unlock Resources", icon: KeyRound, kind: "Unlock Resources", startStatus: "active", hint: "Force-release locked records", fields: UNLOCK_FIELDS, destructive: true },
  userLogsClear: { key: "userLogsClear", label: "User Logs — Clear", icon: Eraser, kind: "Logs Clear", startStatus: "active", hint: "Clear a user's log entries", fields: [{ name: "user", label: "User", required: true }, { name: "reason", label: "Reason", required: true }], destructive: true },
  userLogsQuery: { key: "userLogsQuery", label: "User Logs — Query", icon: Search, kind: "Logs Query", startStatus: "active", hint: "Query user activity logs", fields: LOG_FIELDS },
  userRightsQuery: { key: "userRightsQuery", label: "User Rights Query", icon: ShieldQuestion, kind: "User Rights", startStatus: "active", hint: "Inspect a user's effective permissions", fields: [{ name: "user", label: "User", required: true }, { name: "facility", label: "Facility scope" }] },
  viewAuthMessage: { key: "viewAuthMessage", label: "View Auth Message (XML)", icon: FileCode, kind: "Auth Message", startStatus: "active", hint: "View the raw authorisation message payload", fields: [{ name: "reference", label: "Auth reference", required: true }] },
};

export type SectionKey =
  | "users" | "facilities" | "reference" | "billing" | "printing" | "monitoring"
  | "workflow" | "documents" | "featureFlags" | "support";

export const SECTIONS: {
  key: SectionKey;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind gradient classes
  ring: string;
  actions: ActionKey[];
}[] = [
  {
    key: "users", slug: "users", title: "Users & Access",
    tagline: "Identity, roles, approvals",
    description: "Invite team members, define approval scopes, and control who can act on sensitive records.",
    icon: Users,
    accent: "from-indigo-500/25 via-primary/20 to-transparent",
    ring: "ring-indigo-400/30",
    actions: ["maintainUser", "manageApprovers", "sanctionPractitioner", "userRightsQuery", "unlockMe", "unlockResources"],
  },
  {
    key: "facilities", slug: "facilities", title: "Facilities",
    tagline: "Hospitals, wards & theatres",
    description: "Maintain the physical topology of your network — hospitals, wards, theatres, and connectivity.",
    icon: Building,
    accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
    ring: "ring-emerald-400/30",
    actions: ["editFacilities", "maintainHospital", "editTheatre", "editWard", "pingFacility"],
  },
  {
    key: "workflow", slug: "workflow", title: "Workflow Configuration",
    tagline: "States · transitions · owners",
    description: "Configure workflow states, transitions, routing rules and approver ladders across modules.",
    icon: Workflow,
    accent: "from-sky-500/25 via-primary/15 to-transparent",
    ring: "ring-sky-400/30",
    actions: ["manageWorkflow", "manageApprovers", "submitCaseOwners"],
  },
  {
    key: "documents", slug: "documents", title: "Document Configuration",
    tagline: "Templates · numbering · retention",
    description: "Curate document templates, categories, numbering, retention and signing rules.",
    icon: LayoutTemplate,
    accent: "from-fuchsia-500/25 via-violet-500/15 to-transparent",
    ring: "ring-fuchsia-400/30",
    actions: ["docConfig", "maintainTemplates"],
  },
  {
    key: "featureFlags", slug: "feature-flags", title: "Feature Flags",
    tagline: "Toggle · target · rollout",
    description: "Toggle capabilities per environment, tenant, facility or role. Ship dark, roll out safely.",
    icon: ToggleRight,
    accent: "from-teal-500/25 via-emerald-500/15 to-transparent",
    ring: "ring-teal-400/30",
    actions: ["featureToggle"],
  },
  {
    key: "reference", slug: "reference", title: "Reference Data",
    tagline: "Codes, templates, workflow",
    description: "Curate short codes, document templates, workflow steps and feature toggles across the platform.",
    icon: Database,
    accent: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
    ring: "ring-violet-400/30",
    actions: ["shortCodes", "docConfig", "maintainTemplates", "featureToggle", "manageWorkflow"],
  },
  {
    key: "billing", slug: "billing", title: "Billing & Statements",
    tagline: "Invoices, jobs, guarantors",
    description: "Reprint invoices, generate statements, replay failed billing jobs and manage COID overrides.",
    icon: Wallet,
    accent: "from-amber-500/25 via-orange-500/15 to-transparent",
    ring: "ring-amber-400/30",
    actions: ["invoicesStatements", "guarantorStatements", "provincialStatements", "replayBillJob", "submitCaseOwners", "manageCoid"],
  },
  {
    key: "printing", slug: "printing", title: "Printing",
    tagline: "Servers & devices",
    description: "Register print servers and configure the printers used by wards, reception and finance.",
    icon: PrinterCheck,
    accent: "from-sky-500/25 via-cyan-500/15 to-transparent",
    ring: "ring-sky-400/30",
    actions: ["maintainPrinters", "maintainPrintServers"],
  },
  {
    key: "monitoring", slug: "monitoring", title: "Monitoring & Logs",
    tagline: "Health, events, audit",
    description: "Track integration errors, browse activity logs and summarise platform events.",
    icon: LineChart,
    accent: "from-rose-500/25 via-pink-500/15 to-transparent",
    ring: "ring-rose-400/30",
    actions: ["eventSummary", "integrationErrors", "userLogsQuery", "userLogsClear"],
  },
  {
    key: "support", slug: "support", title: "Support Tools",
    tagline: "Diagnose · unlock · replay",
    description: "Operator diagnostics — unlock stuck records, replay failed jobs, ping facilities and query user logs.",
    icon: KeyRound,
    accent: "from-rose-500/25 via-orange-500/15 to-transparent",
    ring: "ring-rose-400/30",
    actions: ["unlockMe", "unlockResources", "replayBillJob", "pingFacility", "viewAuthMessage", "integrationErrors", "userLogsQuery", "userLogsClear"],
  },
];

export function useSubmitAction() {
  const createItem = useWorkflow((s) => s.create);
  return (a: ActionSpec, values: Record<string, string>) => {
    const fields: Record<string, string | number> = { Kind: a.kind };
    a.fields.forEach((f) => {
      const raw = values[f.name] ?? "";
      if (!raw) return;
      fields[f.label] = f.type === "number" ? Number(raw) : raw;
    });
    const title = String(
      values.name || values.facility || values.ward || values.theatre || values.code ||
      values.template || values.workflow || values.party || values.flag || values.resource ||
      values.practitioner || values.jobRef || values.user || a.label
    );
    const subtitle = [values.role, values.scope, values.location, values.period, values.system, values.email]
      .filter(Boolean).join(" · ") || a.kind;

    const rec = createItem("admin", { title, subtitle, status: a.startStatus, fields });
    toast.success(`${a.label} captured`, { description: `${rec.id} · ${title}` });
    return rec;
  };
}

export function ActionDialog({
  spec, onOpenChange, onSubmit,
}: {
  spec: ActionSpec | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (spec: ActionSpec, values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const open = !!spec;

  const handleClose = (o: boolean) => {
    if (!o) setValues({});
    onOpenChange(o);
  };

  const submit = () => {
    if (!spec) return;
    for (const f of spec.fields) {
      if (f.required && !values[f.name]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    onSubmit(spec, values);
    setValues({});
  };

  if (!spec) return null;
  const Icon = spec.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + (spec.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{spec.label}</DialogTitle>
              <DialogDescription>{spec.hint}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[calc(90vh-11rem)] space-y-3 overflow-y-auto px-6 py-4">
          {spec.fields.map((f) => (
            <div key={f.name} className="grid gap-1.5">
              <Label htmlFor={`${spec.key}-${f.name}`}>
                {f.label}{f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`${spec.key}-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={`${spec.key}-${f.name}`}
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button
            onClick={submit}
            className={spec.destructive ? "bg-destructive text-destructive-foreground hover:opacity-90" : "bg-gradient-primary hover:opacity-90"}
          >
            Save {spec.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
