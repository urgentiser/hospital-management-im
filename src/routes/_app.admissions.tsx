import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  UserPlus, Eye, MapPin, ArrowRightLeft, LogOut, Undo2, Baby, Ban, StopCircle,
  Receipt, FileText, ClipboardCheck, ShieldOff, BedDouble, Clock, ShieldAlert,
  Building2, HeartPulse, ClipboardList, Wallet,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { AdmissionProcessSelector } from "@/modules/admissions/components/process-selector";
import { AdmissionCreationWizard, type CreationVariant } from "@/modules/admissions/components/creation-wizard";
import { AdmissionManagementWizard, type ManagementVariant } from "@/modules/admissions/components/management-wizard";


const config: ModuleConsoleConfig = {
  moduleKey: "admissions",
  patientScoped: true,
  eyebrow: "Clinical · Admissions",
  title: "Admissions",
  description: "Admit, transfer, discharge and bill inpatients across every Life Healthcare facility.",
  heroHeadline: "One command centre for the entire inpatient journey.",
  heroBlurb: "From admission to discharge — track beds, authorisations and billing without leaving the console.",
  heroBadge: "Live · Bed board",
  heroCtas: [
    { label: "Admit a patient", sectionKey: "movement", primary: true },
    { label: "Billing & bills", sectionKey: "billing" },
    { label: "No-auth board", sectionKey: "authorisation" },
  ],
  overviewKpis: (items) => {
    const admitted = items.filter((i) => i.status === "admitted").length;
    const pending = items.filter((i) => i.status === "pending").length;
    const discharged = items.filter((i) => i.status === "discharged").length;
    const noAuth = items.filter((i) => String(i.fields.Auth ?? "").toLowerCase() === "none").length;
    return [
      { label: "Currently admitted", value: admitted, icon: BedDouble, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Pending", value: pending, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Discharged", value: discharged, icon: LogOut, accent: "from-slate-500/30 to-transparent", tone: "muted" },
      { label: "No-auth flagged", value: noAuth, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    ];
  },
  sectionKpis: (section, items) => {
    if (section.key === "movement") {
      return [
        { label: "Admitted", value: items.filter((i) => i.status === "admitted").length, icon: HeartPulse, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Transferred", value: items.filter((i) => i.status === "transferred").length, icon: ArrowRightLeft, accent: "from-sky-500/30 to-transparent" },
        { label: "Discharged", value: items.filter((i) => i.status === "discharged").length, icon: LogOut, accent: "from-slate-500/30 to-transparent", tone: "muted" },
        { label: "Cancelled", value: items.filter((i) => i.status === "cancelled").length, icon: Ban, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      ];
    }
    if (section.key === "authorisation") {
      const noAuth = items.filter((i) => String(i.fields.Auth ?? "").toLowerCase() === "none").length;
      return [
        { label: "No-auth", value: noAuth, icon: ShieldOff, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
        { label: "Pending", value: items.filter((i) => i.status === "pending").length, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Active", value: items.filter((i) => i.status === "admitted").length, icon: ShieldAlert, accent: "from-primary/30 to-transparent" },
      ];
    }
    if (section.key === "billing") {
      const finalised = items.filter((i) => String(i.fields["Bill Status"] ?? "") === "finalised").length;
      return [
        { label: "Bills open", value: items.length - finalised, icon: Receipt, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Finalised", value: finalised, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Statements", value: items.filter((i) => String(i.fields["Kind"] ?? "").includes("Statement")).length, icon: FileText, accent: "from-primary/30 to-transparent" },
      ];
    }
    return [
      { label: "Facilities", value: 8, icon: Building2, accent: "from-primary/30 to-transparent" },
      { label: "Beds", value: 1810, icon: BedDouble, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    ];
  },
  sections: [
    {
      key: "movement",
      title: "Patient Movement",
      tagline: "Admit · transfer · discharge",
      description: "Every touch-point in the patient journey — admission, ward moves, discharge, undischarge and neonate registration.",
      icon: BedDouble,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "admit", label: "Admit a Patient", icon: UserPlus, hint: "Capture a new admission", kind: "Admit", startStatus: "admitted",
          fields: [
            { name: "patient", label: "Patient name", required: true },
            { name: "mrn", label: "MRN", placeholder: "IMP-…" },
            { name: "facility", label: "Facility", required: true },
            { name: "ward", label: "Ward", required: true, placeholder: "e.g. Ward 3B" },
            { name: "bed", label: "Bed" },
            { name: "practitioner", label: "Admitting practitioner" },
          ]},
        { key: "view-admission", label: "View Admission", icon: Eye, hint: "Open admission details", kind: "View Admission", startStatus: "active",
          fields: [{ name: "reference", label: "Admission reference", required: true, placeholder: "ADM-…" }] },
        { key: "location", label: "Patient Location", icon: MapPin, hint: "Current ward and bed", kind: "Patient Location", startStatus: "active",
          fields: [{ name: "patient", label: "Patient", required: true }] },
        { key: "move-ward", label: "Move to Ward", icon: ArrowRightLeft, hint: "Internal ward transfer", kind: "Ward Move", startStatus: "transferred",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "fromWard", label: "From ward" },
            { name: "toWard", label: "To ward", required: true },
            { name: "reason", label: "Reason", type: "textarea" },
          ]},
        { key: "discharge", label: "Discharge Patient", icon: LogOut, hint: "Complete discharge", kind: "Discharge", startStatus: "discharged",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "destination", label: "Discharge destination", placeholder: "Home / Step-down / Transfer" },
            { name: "notes", label: "Clinical notes", type: "textarea" },
          ]},
        { key: "undischarge", label: "Undischarge EU Patient", icon: Undo2, hint: "Reverse a discharge (Emergency Unit)", kind: "Undischarge", startStatus: "admitted",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "register-birth", label: "Register Birth", icon: Baby, hint: "Add neonate to mother's admission", kind: "Register Birth", startStatus: "admitted",
          fields: [
            { name: "patient", label: "Mother", required: true },
            { name: "dob", label: "Date of birth", placeholder: "YYYY-MM-DD" },
            { name: "gender", label: "Gender" },
            { name: "weight", label: "Weight (g)", type: "number" },
          ]},
        { key: "cancel", label: "Cancel Admission", icon: Ban, hint: "Release the bed", kind: "Cancel Admission", startStatus: "cancelled",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "discontinue", label: "Discontinue Admission", icon: StopCircle, hint: "Stop in-progress admission", kind: "Discontinue", startStatus: "discontinued",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "authorisation",
      title: "Authorisation & Location",
      tagline: "No-auth · location · admissions view",
      description: "Manage authorisation exceptions and quickly locate any inpatient in the network.",
      icon: ShieldAlert,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "no-auth", label: "Flag No-Auth", icon: ShieldOff, hint: "Mark admission as no authorisation", kind: "No Auth", startStatus: "pending",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "no-auth-admissions", label: "No Auth Admissions", icon: ShieldAlert, hint: "Board of open no-auth admissions", kind: "No Auth Board", startStatus: "active",
          fields: [{ name: "facility", label: "Facility" }] },
        { key: "patient-location", label: "Patient Location Lookup", icon: MapPin, hint: "Locate any inpatient", kind: "Location Lookup", startStatus: "active",
          fields: [{ name: "patient", label: "Patient", required: true }] },
      ],
    },
    {
      key: "dashboard",
      title: "Dashboard",
      tagline: "Ops overview",
      description: "Facility-level occupancy, length of stay and no-auth board at a glance.",
      icon: ClipboardList,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "view-dashboard", label: "View Dashboard", icon: ClipboardList, hint: "Open the operational dashboard", kind: "Dashboard", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "period", label: "Period", placeholder: "e.g. Week 27" },
          ]},
      ],
    },
  ],
  worklist: {
    moduleKey: "admissions",
    name: "Admissions worklist",
    tagline: "Current inpatients, transfers pending and discharge-ready cases.",
    exportable: true,
    defaultSortBy: "updatedAt",
    defaultSortDir: "desc",
    pageSize: 25,
    statusMap: {
      admitted: { label: "Admitted", tone: "success" },
      pending: { label: "Pending", tone: "warning" },
      transferred: { label: "Transferred", tone: "info" },
      discharged: { label: "Discharged", tone: "muted" },
      cancelled: { label: "Cancelled", tone: "destructive" },
      discontinued: { label: "Discontinued", tone: "destructive" },
    },
    columns: [
      { key: "id", label: "Admission #", sortable: true, width: "140px",
        render: (r) => <span className="font-mono text-xs">{r.id}</span> },
      { key: "title", label: "Patient", sortable: true,
        render: (r) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{r.title}</div>
            {r.subtitle && <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>}
          </div>
        ) },
      { key: "Ward", label: "Ward / Bed",
        render: (r) => <span>{String(r.fields["Ward"] ?? r.fields["To Ward"] ?? "—")}{r.fields["Bed"] ? ` · ${r.fields["Bed"]}` : ""}</span> },
      { key: "Admitting practitioner", label: "Practitioner",
        render: (r) => String(r.fields["Admitting practitioner"] ?? r.fields["Practitioner"] ?? "—") },
      { key: "Auth", label: "Auth",
        render: (r) => {
          const auth = String(r.fields["Auth"] ?? r.fields["Authorisation ref"] ?? "").trim();
          if (!auth || auth.toLowerCase() === "none") {
            return <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-600 dark:text-rose-400">No-auth</span>;
          }
          return <span className="font-mono text-[11px]">{auth}</span>;
        } },
      { key: "status", label: "Status",
        render: (r) => {
          const map: Record<string, { label: string; tone: "success" | "warning" | "info" | "muted" | "destructive" }> = {
            admitted: { label: "Admitted", tone: "success" },
            pending: { label: "Pending", tone: "warning" },
            transferred: { label: "Transferred", tone: "info" },
            discharged: { label: "Discharged", tone: "muted" },
            cancelled: { label: "Cancelled", tone: "destructive" },
            discontinued: { label: "Discontinued", tone: "destructive" },
          };
          const cfg = map[r.status] ?? { label: r.status, tone: "muted" as const };
          const tones = {
            success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            info: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
            muted: "border-border bg-muted/60 text-muted-foreground",
            destructive: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
          };
          return <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " + tones[cfg.tone]}>{cfg.label}</span>;
        } },
      { key: "updatedAt", label: "Updated", sortable: true, defaultVisible: false,
        render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt || r.createdAt).toLocaleString("en-ZA")}</span> },
    ],
    filters: [
      { key: "status", label: "Status", kind: "select", options: [
        { value: "admitted", label: "Admitted" },
        { value: "pending", label: "Pending" },
        { value: "transferred", label: "Transferred" },
        { value: "discharged", label: "Discharged" },
        { value: "cancelled", label: "Cancelled" },
      ] },
      { key: "Auth", label: "Authorisation", kind: "select", options: [
        { value: "none", label: "No-auth only" },
      ] },
      { key: "Ward", label: "Ward", kind: "text", placeholder: "e.g. Ward 3B" },
      { key: "updated", label: "Updated between", kind: "date-range" },
      { key: "noAuthOnly", label: "No-auth flagged only", kind: "boolean" },
    ],
    summary: (items) => {
      const admitted = items.filter((i) => i.status === "admitted").length;
      const pending = items.filter((i) => i.status === "pending").length;
      const noAuth = items.filter((i) => String(i.fields["Auth"] ?? "").toLowerCase() === "none").length;
      const discharged = items.filter((i) => i.status === "discharged").length;
      return [
        { label: "Currently admitted", value: admitted, tone: "success" as const },
        { label: "Pending admission", value: pending, tone: "warning" as const },
        { label: "No-auth flagged", value: noAuth, tone: "destructive" as const },
        { label: "Discharged", value: discharged, tone: "muted" as const },
      ];
    },
    savedViews: [
      { key: "no-auth", label: "No-auth admissions", description: "All admissions flagged as no-authorisation.",
        filters: { noAuthOnly: true } },
      { key: "discharge-ready", label: "Discharge ready", description: "Admitted cases ready for discharge review.",
        filters: { status: "admitted" } },
      { key: "pending-in", label: "Pending admissions", description: "Preadmissions awaiting bed allocation.",
        filters: { status: "pending" } },
    ],
    rowActions: [
      { key: "open", label: "Open in guided workflow", launchesGuidedWorkflow: true, permission: "view" },
      { key: "transferred", label: "Transfer / move ward", targetStep: "changes", launchesGuidedWorkflow: true, permission: "manage",
        visibleWhen: (r) => r.status === "admitted" },
      { key: "discharged", label: "Discharge patient", targetStep: "discharge", launchesGuidedWorkflow: true, permission: "manage",
        visibleWhen: (r) => r.status === "admitted" },
      { key: "cancelled", label: "Cancel admission", destructive: true, requiresReason: true, permission: "manage",
        visibleWhen: (r) => r.status === "pending" || r.status === "admitted" },
    ],
    // Bulk admission, discharge, finalisation, refund, reversal, patient merge,
    // clinical sign-off and claim submission are prohibited by policy.
    bulkActions: [],
  },
  businessFlow: {
    moduleKey: "admissions",
    title: "Admissions",
    purpose: "Admit, locate, transfer, discharge, cancel and review patient visits while preserving funding and clinical context.",
    legacySource: "Rich/Admissions/Client.Implet; rich.admissions.menu.xml",
    routeFamily: ["/admissions", "/admissions/new", "/admissions/{id}", "/admissions/{id}/move", "/admissions/{id}/discharge"],
    patientRequired: true,
    completionKind: "Admit",
    completionStatus: "admitted",
    completionLabel: "Admission",
    titleFrom: (v) => v.patient || "New admission",
    subtitleFrom: (v) => [v.facility, v.ward, v.bed && `Bed ${v.bed}`].filter(Boolean).join(" · "),
    events: [
      "AdmissionCreated", "PatientAdmitted", "BedAllocated", "PatientMoved",
      "AdmissionDischarged", "AdmissionCancelled", "AdmissionDiscontinued",
      "AdmissionUndischarged", "BirthRegistered",
    ],
    handoffs: ["Ward Management", "Theatre Management", "Billing", "Case Management", "Documents"],
    globalRules: [
      "A patient must exist before a normal admission.",
      "Duplicate active admissions must be blocked or explicitly authorised.",
      "A bed cannot be allocated to more than one active occupant for overlapping time.",
      "No-authorisation admission must create follow-up work.",
      "Discharge requires date/time, disposition and completion of mandatory checks.",
      "Undischarge, cancellation and discontinuation require elevated permissions and reasons.",
      "Every location change must maintain a complete accommodation history.",
    ],
    acceptance: [
      "Convert a ready preadmission and allocate a bed.",
      "Complete a direct no-authorisation admission and verify follow-up work.",
      "Transfer and discharge a patient while preserving accommodation and audit history.",
    ],
    steps: [
      { key: "facility", title: "Select facility and identify patient / preadmission", description: "Set the active facility, then find the patient or the ready preadmission.",
        fields: [
          { name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] },
          { name: "patient", label: "Patient", required: true },
          { name: "mrn", label: "MRN" },
          { name: "preadmissionRef", label: "Preadmission reference (if converting)", placeholder: "PA-…" },
        ] },
      { key: "verify", title: "Verify patient, consent, funding, guarantor, authorisation", description: "Confirm the patient context is complete: consent captured, funding verified, authorisation on file.",
        checklist: [
          "Patient identity confirmed against ID / MRN",
          "Consent up to date",
          "Funding / scheme validated",
          "Guarantor confirmed",
          "Authorisation reference present, or no-auth exception noted",
        ] },
      { key: "capture", title: "Admission type, source, date/time, practitioner, reason", description: "Capture the operational admission detail.",
        fields: [
          { name: "type", label: "Admission type", type: "select", required: true, options: ["Inpatient", "Day case", "Emergency", "Obstetric", "Neonate", "Observation"] },
          { name: "source", label: "Source", type: "select", options: ["Preadmission", "Direct", "Emergency Unit", "Transfer in", "Theatre direct"] },
          { name: "admittedAt", label: "Admission date/time", required: true, placeholder: "YYYY-MM-DD HH:mm" },
          { name: "practitioner", label: "Admitting practitioner", required: true },
          { name: "reason", label: "Reason for admission", type: "textarea", required: true },
        ] },
      { key: "validate", title: "Validate duplicate admission and readiness", description: "System blocks duplicate active admissions and re-checks readiness rules before creation.",
        checklist: [
          "No other active admission for this patient",
          "All readiness gates green (or explicit override captured)",
        ],
        rules: ["Duplicate active admissions must be blocked or explicitly authorised."] },
      { key: "create", title: "Create admission and assign number", description: "Admission record created and admission number issued.",
        fields: [{ name: "authRef", label: "Authorisation ref (if applicable)", placeholder: "AUTH-…" }],
        events: ["AdmissionCreated", "PatientAdmitted"] },
      { key: "bed", title: "Allocate ward and bed", description: "Assign a ward and bed where clinically required. Bed availability is verified.",
        fields: [
          { name: "ward", label: "Ward", required: true, placeholder: "e.g. Ward 3B" },
          { name: "bed", label: "Bed" },
          { name: "accommodationType", label: "Accommodation type", type: "select", options: ["General", "Semi-private", "Private", "HDU", "ICU"] },
        ],
        events: ["BedAllocated"],
        rules: ["A bed cannot be allocated to more than one active occupant for overlapping time."] },
      { key: "changes", title: "Maintain location and practitioner changes", description: "During the stay, record ward moves and practitioner changes with a full accommodation history.",
        fields: [
          { name: "moveTo", label: "Move to ward / bed (if any)" },
          { name: "practitionerChange", label: "Practitioner change (if any)" },
          { name: "moveReason", label: "Reason", type: "textarea" },
        ],
        events: ["PatientMoved"] },
      { key: "predischarge", title: "Review outstanding tasks at discharge", description: "Review outstanding clinical, billing, document and case tasks before discharge.",
        checklist: [
          "Clinical tasks resolved",
          "Ward and theatre charges finalised",
          "Documents (discharge summary, scripts, sick note) prepared",
          "Case management sign-off complete",
        ] },
      { key: "discharge", title: "Capture discharge details", description: "Capture the discharge date/time, disposition and reason.",
        fields: [
          { name: "dischargedAt", label: "Discharge date/time", placeholder: "YYYY-MM-DD HH:mm" },
          { name: "disposition", label: "Disposition", type: "select", options: ["Home", "Step-down facility", "Transfer out", "Deceased", "Self-discharge"] },
          { name: "dischargeReason", label: "Reason / clinical summary", type: "textarea" },
        ],
        events: ["AdmissionDischarged"] },
      { key: "close", title: "Close accommodation and initiate billing / case", description: "Accommodation is closed and final billing and case-management flows are initiated.",
        events: ["AdmissionDischarged"],
        checklist: ["Accommodation closed", "Final bill triggered", "Case management notified"] },
      { key: "exceptions", title: "Cancel, discontinue or undischarge", description: "For exception paths, capture reason and confirm elevated-permission action.",
        fields: [
          { name: "exception", label: "Exception action", type: "select", options: ["None", "Cancel admission", "Discontinue admission", "Undischarge (EU)"] },
          { name: "exceptionReason", label: "Reason", type: "textarea" },
        ],
        events: ["AdmissionCancelled", "AdmissionDiscontinued", "AdmissionUndischarged"],
        rules: ["Undischarge, cancellation and discontinuation require elevated permissions and reasons."] },
    ],
  },
};

const CREATION_KEYS = new Set<CreationVariant>(["admit", "convert-pre", "direct-admit", "emergency-admit", "no-auth-admit"]);
const MANAGEMENT_KEYS = new Set<ManagementVariant>(["view-admission", "patient-location", "allocate-bed", "move-ward", "change-practitioner", "register-birth"]);

function AdmissionsRoute() {
  const scrollAnchor = useRef<HTMLDivElement>(null);
  const [wizardVariant, setWizardVariant] = useState<CreationVariant | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mgmtVariant, setMgmtVariant] = useState<ManagementVariant | null>(null);
  const [mgmtOpen, setMgmtOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <AdmissionProcessSelector
          onLaunch={(process) => {
            if (CREATION_KEYS.has(process.key as CreationVariant)) {
              setWizardVariant(process.key as CreationVariant);
              setWizardOpen(true);
              return;
            }
            if (MANAGEMENT_KEYS.has(process.key as ManagementVariant)) {
              setMgmtVariant(process.key as ManagementVariant);
              setMgmtOpen(true);
              return;
            }
            scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            if (typeof window !== "undefined") {
              window.location.hash = `#p=${process.key}`;
            }
          }}
        />
      </div>
      <div ref={scrollAnchor}>
        <ModuleConsole config={config} />
      </div>
      <AdmissionCreationWizard variant={wizardVariant} open={wizardOpen} onOpenChange={setWizardOpen} />
      <AdmissionManagementWizard variant={mgmtVariant} open={mgmtOpen} onOpenChange={setMgmtOpen} />
    </div>
  );
}


export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: AdmissionsRoute,
});
