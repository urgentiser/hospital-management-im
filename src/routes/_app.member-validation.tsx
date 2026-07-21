import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck, Search, UserCheck, FileSignature, AlertTriangle, RefreshCcw, CheckCircle2, Users,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "member-validation",
  patientScoped: true,
  eyebrow: "Patient Care · Funding Verification",
  title: "Member Validation",
  description: "Verify medical scheme membership, principal member, dependant and consent information.",
  heroHeadline: "Validate scheme membership before every funded event.",
  heroBlurb: "Run real-time eligibility, confirm principal member and dependant links, and capture consent — all before authorisation or billing.",
  heroBadge: "Live · Eligibility desk",
  heroCtas: [
    { label: "Validate a member", sectionKey: "validation", primary: true },
    { label: "Re-verify eligibility", sectionKey: "reverify" },
    { label: "Capture consent", sectionKey: "consent" },
  ],
  overviewKpis: (items) => [
    { label: "Pending checks", value: items.filter((i) => i.status === "pending").length, icon: Search, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Verified today", value: items.filter((i) => i.status === "approved").length, icon: ShieldCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Failed / mismatched", value: items.filter((i) => i.status === "declined").length, icon: AlertTriangle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    { label: "Consents captured", value: items.filter((i) => (i.fields?.["financialConsent"] === "Yes") || (i.fields?.["popia"] === "Yes")).length, icon: FileSignature, accent: "from-sky-500/30 to-transparent" },
  ],
  sections: [
    {
      key: "validation",
      title: "Membership validation",
      tagline: "Verify · confirm",
      description: "Run scheme eligibility checks and confirm principal member and dependant status.",
      icon: ShieldCheck,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "validate", label: "Validate Member", icon: UserCheck, hint: "Run a live eligibility check against the scheme", kind: "Validation", startStatus: "pending",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "scheme", label: "Scheme", required: true },
            { name: "membership", label: "Membership no.", required: true },
            { name: "dependantCode", label: "Dependant code" },
          ]},
        { key: "confirm", label: "Confirm Principal & Dependant", icon: Users, hint: "Confirm relationship and cover", kind: "Confirmation", startStatus: "approved",
          fields: [
            { name: "principal", label: "Principal member", required: true },
            { name: "dependant", label: "Dependant", required: true },
            { name: "relationship", label: "Relationship" },
          ]},
      ],
    },
    {
      key: "reverify",
      title: "Re-verification",
      tagline: "Refresh · resolve",
      description: "Re-run eligibility for long-stay patients and resolve mismatches raised by the scheme.",
      icon: RefreshCcw,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "reverify", label: "Re-verify Eligibility", icon: RefreshCcw, hint: "Re-run eligibility for an active episode", kind: "Re-verification", startStatus: "pending",
          fields: [
            { name: "episode", label: "Episode / admission", required: true },
            { name: "reason", label: "Reason", type: "textarea" },
          ]},
        { key: "resolve", label: "Resolve Mismatch", icon: CheckCircle2, hint: "Clear a scheme-raised discrepancy", kind: "Resolution", startStatus: "approved",
          fields: [
            { name: "reference", label: "Validation reference", required: true },
            { name: "issue", label: "Issue raised", required: true },
            { name: "resolution", label: "Resolution", required: true, type: "textarea" },
          ]},
      ],
    },
    {
      key: "consent",
      title: "Consent & disclosure",
      tagline: "Capture · sign",
      description: "Capture financial responsibility, PoPIA and treatment consents linked to the validated membership.",
      icon: FileSignature,
      accent: "from-sky-500/25 via-indigo-500/15 to-transparent",
      ring: "ring-sky-400/30",
      actions: [
        { key: "financial-consent", label: "Financial Responsibility Consent", icon: FileSignature, hint: "Signed acknowledgement of liability", kind: "Consent", startStatus: "approved",
          fields: [
            { name: "signedBy", label: "Signed by", required: true },
            { name: "relationship", label: "Relationship to patient" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "popia", label: "PoPIA Consent", icon: ShieldCheck, hint: "Data-sharing consent for scheme and clinicians", kind: "Consent", startStatus: "approved",
          fields: [
            { name: "signedBy", label: "Signed by", required: true },
            { name: "scope", label: "Scope", placeholder: "Scheme, clinicians, MyLife" },
          ]},
      ],
    },
  ],
  worklist: makeDefaultWorklist("member-validation", "Member Validation"),

  businessFlow: {
    moduleKey: "member-validation",
    title: "Member Validation",
    purpose: "Verify medical scheme cover, principal member and dependant details, and capture consent before any funded activity.",
    globalRules: [],
    events: [],
    acceptance: [],
    patientRequired: true,
    completionKind: "Validation",
    completionStatus: "approved",
    completionLabel: "Member validated",
    titleFrom: (v) => `${v.patient ?? "Patient"} · ${v.scheme ?? "Scheme"}`,
    subtitleFrom: (v) => [v.membership, v.dependantCode && `Dep ${v.dependantCode}`].filter(Boolean).join(" · "),
    steps: [
      { key: "patient", title: "Identify patient", description: "Confirm patient identity and MRN before running scheme checks.",
        fields: [
          { name: "patient", label: "Patient", required: true },
          { name: "mrn", label: "MRN" },
          { name: "idNumber", label: "ID / Passport no." },
        ]},
      { key: "scheme", title: "Scheme & membership", description: "Capture the scheme, plan option and membership number as they appear on the card.",
        fields: [
          { name: "scheme", label: "Scheme", type: "select", required: true, options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Medscheme", "Fedhealth", "Sizwe Hosmed", "Bankmed"] },
          { name: "plan", label: "Plan / Option" },
          { name: "membership", label: "Membership no.", required: true },
          { name: "dependantCode", label: "Dependant code", placeholder: "00 = principal" },
        ]},
      { key: "principal", title: "Principal member", description: "Confirm the principal member and their contact details.",
        fields: [
          { name: "principalName", label: "Principal member name", required: true },
          { name: "principalId", label: "Principal ID no." },
          { name: "relationship", label: "Relationship to patient", type: "select", options: ["Self", "Spouse", "Child", "Parent", "Other dependant"] },
          { name: "principalContact", label: "Contact number" },
        ]},
      { key: "eligibility", title: "Live eligibility check", description: "Run a real-time eligibility check against the scheme and capture the response.",
        fields: [
          { name: "eligibilityStatus", label: "Eligibility status", type: "select", required: true, options: ["Active", "Suspended", "Terminated", "Waiting period", "Unknown"] },
          { name: "responseRef", label: "Scheme response reference" },
          { name: "notes", label: "Response notes", type: "textarea" },
        ],
        checklist: ["Cover active on date of service", "Waiting periods and exclusions reviewed", "Sub-limits and savings balance noted"] },
      { key: "benefits", title: "Benefits & limits", description: "Capture applicable benefits, day-to-day balance, hospital cover and known exclusions.",
        fields: [
          { name: "hospitalCover", label: "Hospital cover", type: "select", options: ["Unlimited", "Limited", "None"] },
          { name: "savingsBalance", label: "Savings balance (R)", type: "number" },
          { name: "exclusions", label: "Exclusions / conditions", type: "textarea" },
        ]},
      { key: "consent", title: "Consent & disclosure", description: "Capture financial responsibility and PoPIA consent linked to this membership.",
        fields: [
          { name: "financialConsent", label: "Financial responsibility signed", type: "select", options: ["Yes", "No", "Deferred"] },
          { name: "popia", label: "PoPIA consent captured", type: "select", options: ["Yes", "No"] },
          { name: "signedBy", label: "Signed by" },
        ],
        checklist: ["Patient / guarantor briefed on liability", "Scheme sharing consent recorded", "Consent stored to patient record"] },
      { key: "outcome", title: "Confirm outcome & hand off", description: "Record the final validation outcome and route the patient to Preadmissions, Admissions or Authorisations." },
    ],
  },
};

export const Route = createFileRoute("/_app/member-validation")({
  head: () => ({
    meta: [
      { title: "Member Validation — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
