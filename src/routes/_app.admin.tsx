import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sparkles, ChevronDown,
  Hash, FileCog, Building2, Scissors, BedDouble, CalendarClock, ToggleRight,
  FileBarChart, AlertTriangle, Receipt, Hospital, Server, Printer, LayoutTemplate,
  UserCog, UserCheck, ShieldAlert, Workflow, Radio, MapPinned, RefreshCw,
  Ban, FileCheck2, LockOpen, KeyRound, Eraser, Search,
} from "lucide-react";

import { WorkflowModule } from "@/components/workflow-module";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWorkflow } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Impilo" },
      { name: "description", content: "Users, roles, facility reference data, and platform administration actions." },
    ],
  }),
  component: AdminPage,
});

type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
};

type ActionKey =
  | "shortCodes" | "docConfig" | "editFacilities" | "editTheatre" | "editWard"
  | "eventSummary" | "featureToggle" | "guarantorStatements" | "integrationErrors"
  | "invoicesStatements" | "maintainHospital" | "maintainPrintServers" | "maintainPrinters"
  | "maintainTemplates" | "maintainUser" | "manageApprovers" | "manageCoid"
  | "manageWorkflow" | "pingFacility" | "provincialStatements" | "replayBillJob"
  | "sanctionPractitioner" | "submitCaseOwners" | "unlockMe" | "unlockResources"
  | "userLogsClear" | "userLogsQuery";

type ActionSpec = {
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

const ACTIONS: ActionSpec[] = [
  { key: "shortCodes", label: "Maintain Short Codes", icon: Hash, kind: "Short Codes", startStatus: "active", hint: "Reference short codes used across the platform", fields: CODE_FIELDS },
  { key: "docConfig", label: "Document Configuration", icon: FileCog, kind: "Doc Config", startStatus: "active", hint: "Configure document types and numbering", fields: TEMPLATE_FIELDS },
  { key: "editFacilities", label: "Edit Facilities", icon: Building2, kind: "Facility", startStatus: "active", hint: "Maintain facility details", fields: FACILITY_FIELDS },
  { key: "editTheatre", label: "Edit Theatre", icon: Scissors, kind: "Theatre", startStatus: "active", hint: "Add or edit theatres", fields: THEATRE_FIELDS },
  { key: "editWard", label: "Edit Ward", icon: BedDouble, kind: "Ward", startStatus: "active", hint: "Add or edit wards", fields: WARD_FIELDS },
  { key: "eventSummary", label: "Event Summary", icon: CalendarClock, kind: "Event Summary", startStatus: "active", hint: "Summary of platform events", fields: EVENT_FIELDS },
  { key: "featureToggle", label: "Feature Toggle", icon: ToggleRight, kind: "Feature Toggle", startStatus: "active", hint: "Enable/disable features", fields: TOGGLE_FIELDS },
  { key: "guarantorStatements", label: "Guarantor Statements", icon: FileBarChart, kind: "Guarantor Statement", startStatus: "active", hint: "Generate guarantor statements", fields: STATEMENT_FIELDS },
  { key: "integrationErrors", label: "Integration Errors", icon: AlertTriangle, kind: "Integration Errors", startStatus: "active", hint: "Review external integration failures", fields: INTEGRATION_FIELDS },
  { key: "invoicesStatements", label: "Invoices & Statements", icon: Receipt, kind: "Invoices & Statements", startStatus: "active", hint: "Reprint or review invoices and statements", fields: STATEMENT_FIELDS },
  { key: "maintainHospital", label: "Maintain Hospital", icon: Hospital, kind: "Hospital", startStatus: "active", hint: "Hospital-level configuration", fields: FACILITY_FIELDS },
  { key: "maintainPrintServers", label: "Maintain Print Servers", icon: Server, kind: "Print Server", startStatus: "active", hint: "Configure print servers", fields: [{ name: "name", label: "Server name", required: true }, { name: "host", label: "Host", required: true }] },
  { key: "maintainPrinters", label: "Maintain Printers", icon: Printer, kind: "Printer", startStatus: "active", hint: "Configure printers", fields: PRINTER_FIELDS },
  { key: "maintainTemplates", label: "Maintain Templates", icon: LayoutTemplate, kind: "Template", startStatus: "active", hint: "Manage document templates", fields: TEMPLATE_FIELDS },
  { key: "maintainUser", label: "Maintain User", icon: UserCog, kind: "User", startStatus: "active", hint: "Invite or edit users", fields: USER_FIELDS },
  { key: "manageApprovers", label: "Manage Approvers", icon: UserCheck, kind: "Approvers", startStatus: "active", hint: "Set approvers and thresholds", fields: APPROVER_FIELDS },
  { key: "manageCoid", label: "Manage COID Claims", icon: ShieldAlert, kind: "COID Admin", startStatus: "active", hint: "COID configuration and overrides", fields: [{ name: "employer", label: "Employer", required: true }, { name: "notes", label: "Notes", type: "textarea" }] },
  { key: "manageWorkflow", label: "Manage Workflow", icon: Workflow, kind: "Workflow", startStatus: "active", hint: "Configure workflow steps", fields: WORKFLOW_FIELDS },
  { key: "pingFacility", label: "Ping Facility", icon: Radio, kind: "Facility Ping", startStatus: "active", hint: "Test connectivity to a facility", fields: PING_FIELDS },
  { key: "provincialStatements", label: "Provincial Statements", icon: MapPinned, kind: "Provincial Statement", startStatus: "active", hint: "Provincial billing statements", fields: STATEMENT_FIELDS },
  { key: "replayBillJob", label: "Replay BillJob", icon: RefreshCw, kind: "Replay BillJob", startStatus: "active", hint: "Re-run a failed billing job", fields: REPLAY_FIELDS },
  { key: "sanctionPractitioner", label: "Sanction Practitioner", icon: Ban, kind: "Sanction", startStatus: "suspended", hint: "Restrict a practitioner", fields: SANCTION_FIELDS, destructive: true },
  { key: "submitCaseOwners", label: "Submit Case Owners", icon: FileCheck2, kind: "Case Owners", startStatus: "active", hint: "Submit case ownership assignments", fields: CASE_OWNER_FIELDS },
  { key: "unlockMe", label: "Unlock Me", icon: LockOpen, kind: "Unlock Me", startStatus: "active", hint: "Release your own locked resources", fields: [{ name: "reason", label: "Reason", placeholder: "Optional" }] },
  { key: "unlockResources", label: "Unlock Resources", icon: KeyRound, kind: "Unlock Resources", startStatus: "active", hint: "Force-release locked records", fields: UNLOCK_FIELDS, destructive: true },
  { key: "userLogsClear", label: "User Logs — Clear", icon: Eraser, kind: "Logs Clear", startStatus: "active", hint: "Clear a user's log entries", fields: [{ name: "user", label: "User", required: true }, { name: "reason", label: "Reason", required: true }], destructive: true },
  { key: "userLogsQuery", label: "User Logs — Query", icon: Search, kind: "Logs Query", startStatus: "active", hint: "Query user activity logs", fields: LOG_FIELDS },
];

const ACTION_SECTIONS: { title: string; keys: ActionKey[] }[] = [
  { title: "Users & Access", keys: ["maintainUser", "manageApprovers", "sanctionPractitioner", "unlockMe", "unlockResources"] },
  { title: "Facilities", keys: ["editFacilities", "maintainHospital", "editTheatre", "editWard", "pingFacility"] },
  { title: "Reference Data", keys: ["shortCodes", "docConfig", "maintainTemplates", "featureToggle", "manageWorkflow"] },
  { title: "Billing & Statements", keys: ["invoicesStatements", "guarantorStatements", "provincialStatements", "replayBillJob", "submitCaseOwners", "manageCoid"] },
  { title: "Printing", keys: ["maintainPrinters", "maintainPrintServers"] },
  { title: "Monitoring & Logs", keys: ["eventSummary", "integrationErrors", "userLogsQuery", "userLogsClear"] },
];

function AdminPage() {
  const createItem = useWorkflow((s) => s.create);
  const [activeAction, setActiveAction] = useState<ActionSpec | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const submitAction = (a: ActionSpec, values: Record<string, string>) => {
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

    const rec = createItem("admin", {
      title,
      subtitle,
      status: a.startStatus,
      fields,
    });
    toast.success(`${a.label} captured`, { description: `${rec.id} · ${title}` });
    setActiveAction(null);
  };

  return (
    <>
      <WorkflowModule
        config={{
          moduleKey: "admin",
          eyebrow: "Platform · Administration",
          title: "Users & Roles",
          description: "Invite users, assign roles and manage reference data across the platform.",
          workflow: ["invited", "active", "suspended"],
          columns: [
            { key: "title", label: "Entry" },
            { key: "Kind", label: "Action" },
            { key: "Email", label: "Email" },
            { key: "Role", label: "Role" },
          ],
          fields: [
            { key: "name", label: "Full name", required: true },
            { key: "email", label: "Email", required: true },
            { key: "role", label: "Role", type: "select", required: true, options: ["Clinical Lead", "Case Manager", "Billing", "Pharmacy", "Admin", "Read-only"] },
          ],
          titleFrom: (f) => String(f["Full name"] || "New user"),
          subtitleFrom: (f) => `${f["Role"] ?? ""} · ${f["Email"] ?? ""}`,
          extras: (
            <div className="flex justify-end">
              <Card className="w-full max-w-md p-0">
                <button
                  type="button"
                  onClick={() => setActionsOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={actionsOpen}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Administration</div>
                      <div className="text-sm font-medium">Quick actions</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={"h-4 w-4 text-muted-foreground transition-transform " + (actionsOpen ? "rotate-180" : "")}
                  />
                </button>
                {actionsOpen && (
                  <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
                    {ACTION_SECTIONS.map((sec) => (
                      <div key={sec.title}>
                        <div className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {sec.title}
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {sec.keys.map((k) => {
                            const a = ACTIONS.find((x) => x.key === k)!;
                            const Icon = a.icon;
                            const hover = a.destructive
                              ? "hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                              : "hover:border-primary/40 hover:bg-primary/10 hover:text-primary";
                            return (
                              <button
                                key={a.key}
                                onClick={() => setActiveAction(a)}
                                title={`${a.label} — ${a.hint}`}
                                aria-label={a.label}
                                className={"group flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors " + hover}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ),
        }}
      />

      <ActionDialog
        spec={activeAction}
        onOpenChange={(o) => !o && setActiveAction(null)}
        onSubmit={submitAction}
      />
    </>
  );
}

function ActionDialog({
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
            <div className={"flex h-9 w-9 items-center justify-center rounded-lg " + (spec.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
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
