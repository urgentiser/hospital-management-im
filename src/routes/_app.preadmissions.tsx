import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus, Search, Eye, Stethoscope, ClipboardCheck, Ban,
  ClipboardList, Clock, ShieldAlert, CheckCircle2, HeartPulse,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "preadmissions",
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
