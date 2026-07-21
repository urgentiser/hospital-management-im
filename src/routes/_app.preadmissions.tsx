import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus, Search, Eye, Stethoscope, ClipboardCheck, Ban,
  ClipboardList, Clock, ShieldAlert, CheckCircle2, HeartPulse,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "preadmissions",
  patientScoped: true,
  eyebrow: "Front Office · Preadmission",
  title: "Preadmission",
  description: "Preadmit patients ahead of arrival, verify scheme cover, complete clinical pre-assessments and hand-over to Admissions.",
  heroHeadline: "Everything sorted before the patient walks in the door.",
  heroBlurb: "Capture the pre-admission, verify authorisation, run the clinical assessment and route to Admissions in a single flow.",
  heroBadge: "Live · Preadmit queue",
  heroCtas: [
    { label: "Preadmit a patient", sectionKey: "intake", primary: true },
    { label: "Assess patient", sectionKey: "assessment" },
    { label: "Search preadmissions", sectionKey: "search" },
  ],
  overviewKpis: (items) => {
    const pending = items.filter((i) => i.status === "pending" || i.status === "verified").length;
    const assessed = items.filter((i) => i.status === "assessed" || i.status === "ready").length;
    const cancelled = items.filter((i) => i.status === "cancelled").length;
    return [
      { label: "Total preadmissions", value: items.length, icon: ClipboardList, accent: "from-primary/30 to-transparent" },
      { label: "Awaiting assessment", value: pending, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Assessed / ready", value: assessed, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Cancelled", value: cancelled, icon: Ban, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    ];
  },
  sections: [
    {
      key: "intake",
      title: "Preadmission Intake",
      tagline: "Preadmit · view · cancel",
      description: "Create, view and cancel pre-admissions before the patient arrives.",
      icon: UserPlus,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "preadmit-patient", label: "Preadmit Patient", icon: UserPlus, hint: "Capture a new pre-admission", kind: "Preadmit Patient", startStatus: "pending",
          fields: [
            { name: "patient", label: "Patient name", required: true },
            { name: "facility", label: "Facility", required: true },
            { name: "expected", label: "Expected date", placeholder: "YYYY-MM-DD" },
            { name: "procedure", label: "Procedure" },
            { name: "scheme", label: "Scheme" },
            { name: "auth", label: "Authorisation number" },
          ]},
        { key: "view-preadmission", label: "View Preadmission", icon: Eye, hint: "Open a preadmission record", kind: "View Preadmission", startStatus: "active",
          fields: [{ name: "reference", label: "Preadmission #", required: true, placeholder: "PA-…" }] },
        { key: "cancel-preadmission", label: "Cancel Preadmission", icon: Ban, hint: "Void a scheduled preadmission", kind: "Cancel Preadmission", startStatus: "cancelled",
          fields: [
            { name: "reference", label: "Preadmission #", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "assessment",
      title: "Clinical Assessment",
      tagline: "Assess · review",
      description: "Complete and review the clinical pre-assessment for a scheduled patient.",
      icon: Stethoscope,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "assess-patient", label: "Assess Patient", icon: Stethoscope, hint: "Capture vitals, allergies and risk", kind: "Assess Patient", startStatus: "assessed",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "vitals", label: "Vitals (BP · HR · Temp · SpO₂)" },
            { name: "allergies", label: "Allergies" },
            { name: "medications", label: "Current medications", type: "textarea" },
            { name: "risk", label: "Risk (low / medium / high)" },
          ]},
        { key: "view-assessment", label: "View Assessment", icon: ClipboardCheck, hint: "Open the assessment record", kind: "View Assessment", startStatus: "active",
          fields: [{ name: "reference", label: "Preadmission #", required: true }] },
        { key: "send-to-admissions", label: "Send to Admissions", icon: CheckCircle2, hint: "Mark ready for admissions hand-off", kind: "Send to Admissions", startStatus: "ready",
          fields: [
            { name: "reference", label: "Preadmission #", required: true },
            { name: "notes", label: "Handover notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "search",
      title: "Search & Board",
      tagline: "Find · monitor",
      description: "Find a preadmission by number, patient or authorisation.",
      icon: Search,
      accent: "from-sky-500/25 via-primary/15 to-transparent",
      ring: "ring-sky-400/30",
      actions: [
        { key: "preadmission-search", label: "Preadmission Search", icon: Search, hint: "Search all preadmissions", kind: "Preadmission Search", startStatus: "active",
          fields: [
            { name: "query", label: "Search term", required: true, placeholder: "Patient / PA-# / Auth" },
            { name: "facility", label: "Facility" },
          ]},
        { key: "no-auth", label: "Flag No-Auth", icon: ShieldAlert, hint: "Mark preadmission missing authorisation", kind: "No-Auth", startStatus: "pending",
          fields: [
            { name: "reference", label: "Preadmission #", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "dashboard",
      title: "Dashboard",
      tagline: "Ops overview",
      description: "Preadmit throughput and hand-off health for the coming week.",
      icon: HeartPulse,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "view-dashboard", label: "View Dashboard", icon: HeartPulse, hint: "Open preadmit dashboard", kind: "Dashboard", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "period", label: "Period" },
          ]},
      ],
    },
  ],
  worklist: makeDefaultWorklist("preadmissions", "Preadmission"),

  businessFlow: {
    moduleKey: "preadmissions",
    title: "Preadmission",
    purpose: "Prepare scheduled or planned admissions before the patient arrives, including practitioner, funding, assessment and authorisation readiness.",
    legacySource: "Rich/Preadmission/Client.Implet; preadmission.menu.xml",
    routeFamily: ["/preadmissions", "/preadmissions/new", "/preadmissions/{id}", "/preadmissions/{id}/cancel"],
    patientRequired: true,
    completionKind: "Preadmit Patient",
    completionStatus: "ready",
    completionLabel: "Preadmission",
    titleFrom: (v) => v.patient || "New preadmission",
    subtitleFrom: (v) => [v.facility, v.plannedDate].filter(Boolean).join(" · "),
    events: [
      "PreadmissionCreated", "PreadmissionUpdated", "PreadmissionReady",
      "PreadmissionCancelled", "PreadmissionConvertedToAdmission",
    ],
    handoffs: ["Authorisations", "Admissions", "Clinical Assessment", "Billing (prepayment)"],
    globalRules: [
      "Planned date and facility are mandatory.",
      "A cancelled preadmission cannot be converted to an admission.",
      "Duplicate active preadmissions for the same planned encounter must be warned or blocked.",
      "Readiness recalculates when funding, authorisation or planned date change.",
      "Conversion must preserve the original preadmission reference and audit lineage.",
    ],
    acceptance: [
      "Create and save a draft preadmission.",
      "Complete readiness checks and convert into an admission.",
      "Cancel a preadmission and verify all dependent actions are disabled.",
    ],
    steps: [
      { key: "facility", title: "Select facility", description: "Set the active facility. Preadmission scope and readiness rules are facility-specific.",
        fields: [{ name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] }] },
      { key: "patient", title: "Search and select patient", description: "Identify the patient by MRN, ID or name. If not found, register via Patient Maintenance first.",
        fields: [
          { name: "patient", label: "Patient", required: true, placeholder: "Surname, First name" },
          { name: "mrn", label: "MRN", placeholder: "IMP-…" },
          { name: "idNumber", label: "National ID / Passport" },
        ] },
      { key: "verify", title: "Verify demographic and contact info", description: "Confirm demographics, address, phone and next of kin. Flag anything stale.",
        checklist: [
          "Demographics reviewed",
          "Address confirmed",
          "Phone / email confirmed",
          "Next of kin confirmed",
        ] },
      { key: "intent", title: "Reason, planned date and practitioner", description: "Capture the reason for admission, planned date, service type and referring / admitting practitioner.",
        fields: [
          { name: "reason", label: "Reason for admission", required: true, type: "textarea" },
          { name: "plannedDate", label: "Planned date/time", required: true, placeholder: "YYYY-MM-DD HH:mm" },
          { name: "serviceType", label: "Service type", type: "select", options: ["Medical", "Surgical", "Obstetric", "Paediatric", "Emergency", "Day case"] },
          { name: "practitioner", label: "Admitting practitioner", required: true },
          { name: "referrer", label: "Referring practitioner" },
        ] },
      { key: "funding", title: "Funding method and guarantor", description: "Confirm scheme cover and guarantor responsibility.",
        fields: [
          { name: "scheme", label: "Scheme / funder", type: "select", options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Private / cash", "COID"] },
          { name: "plan", label: "Plan / option" },
          { name: "membership", label: "Membership no." },
          { name: "guarantor", label: "Guarantor (if not the patient)" },
        ] },
      { key: "resources", title: "Planned ward, theatre or procedure", description: "Where known, reserve planned ward, theatre slot or procedure resources.",
        fields: [
          { name: "ward", label: "Planned ward" },
          { name: "theatre", label: "Planned theatre / slot" },
          { name: "procedure", label: "Planned procedure" },
        ] },
      { key: "attachments", title: "Attach assessment, authorisation and documents", description: "Attach the clinical pre-assessment, authorisation request and supporting documents.",
        fields: [
          { name: "authRef", label: "Authorisation reference", placeholder: "AUTH-…" },
          { name: "assessmentRef", label: "Assessment reference" },
          { name: "documents", label: "Documents", type: "textarea", placeholder: "One per line" },
        ] },
      { key: "prepayment", title: "Capture prepayment", description: "Capture prepayment where required by scheme cover or private billing rules.",
        fields: [
          { name: "prepay", label: "Prepayment amount (R)", type: "number" },
          { name: "receipt", label: "Receipt reference" },
        ] },
      { key: "readiness", title: "Run readiness validation", description: "System recalculates readiness across demographics, consent, assessment, authorisation, funding and documents.",
        checklist: [
          "Demographics complete",
          "Consent captured",
          "Assessment attached",
          "Authorisation reference captured (or exception noted)",
          "Funding verified",
          "Prepayment captured where required",
        ],
        rules: ["Readiness must be re-computed if funding, authorisation or planned date change."] },
      { key: "status", title: "Save as draft or mark ready", description: "Save a draft if further work is needed; otherwise mark the preadmission ready for admissions handover.",
        fields: [{ name: "status", label: "Status", type: "select", required: true, options: ["Draft", "Ready"] }],
        events: ["PreadmissionCreated", "PreadmissionReady"] },
      { key: "convert", title: "Convert to admission or cancel", description: "On arrival, convert the preadmission into an admission (preserving lineage) or cancel with reason.",
        fields: [
          { name: "outcome", label: "Outcome", type: "select", options: ["Convert to admission", "Cancel with reason", "Leave open"] },
          { name: "cancelReason", label: "Cancellation reason (if cancelling)", type: "textarea" },
        ],
        events: ["PreadmissionConvertedToAdmission", "PreadmissionCancelled"] },
    ],
  },
};

export const Route = createFileRoute("/_app/preadmissions")({
  head: () => ({
    meta: [
      { title: "Preadmission — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
