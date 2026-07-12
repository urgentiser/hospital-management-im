import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus, Eye, MapPin, ArrowRightLeft, LogOut, Undo2, Baby, Ban, StopCircle,
  Receipt, FileText, ClipboardCheck, ShieldOff, BedDouble, Clock, ShieldAlert,
  Building2, HeartPulse, ClipboardList, Wallet,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "admissions",
  eyebrow: "Clinical · Admissions Service",
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
      key: "dashboard-placeholder",
      title: "_removed_billing",
      tagline: "",
      description: "",
      icon: MapPin,
      accent: "",
      ring: "",
      actions: [],
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
      { key: "publish", title: "Publish admission and occupancy events", description: "Downstream services (Ward, Billing, Case) receive admission and occupancy events.",
        events: ["PatientAdmitted", "BedAllocated"] },
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

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
