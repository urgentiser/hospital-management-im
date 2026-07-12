import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList, Activity, HeartPulse, Stethoscope, FileSignature,
  ShieldAlert, ListChecks, PenLine, Search, Radio,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "clinical-assessments",
  eyebrow: "Patient Care · Clinical Assessments",
  title: "Clinical Assessments",
  description: "Structured assessment forms, acuity scores and clinical decision support attached to an episode of care.",
  heroHeadline: "Every score, every sign, on the patient's timeline.",
  heroBlurb: "Run structured assessments (MEWS, NEWS2, Braden, Falls, Pain) with per-item validation, decision hints and a signed clinical record.",
  heroBadge: "Live · Assessment desk",
  heroCtas: [
    { label: "Start an assessment", sectionKey: "capture", primary: true },
    { label: "Open assessment board", sectionKey: "board" },
    { label: "Sign & escalate", sectionKey: "signoff" },
  ],
  overviewKpis: (items) => {
    const inProgress = items.filter((i) => i.status === "in-progress").length;
    const completed = items.filter((i) => i.status === "completed" || i.status === "signed").length;
    const escalated = items.filter((i) => i.status === "escalated").length;
    return [
      { label: "Assessments today", value: items.length, icon: ClipboardList, accent: "from-primary/30 to-transparent" },
      { label: "In progress", value: inProgress, icon: Activity, accent: "from-sky-500/30 to-transparent" },
      { label: "Completed / signed", value: completed, icon: FileSignature, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Escalated", value: escalated, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    ];
  },
  sections: [
    {
      key: "capture",
      title: "Assessment Capture",
      tagline: "Score · document · sign",
      description: "Start a new structured assessment: vitals, pain, falls, pressure, neuro or bespoke facility form.",
      icon: ClipboardList,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "start", label: "New Assessment", icon: PenLine, hint: "Start a structured assessment", kind: "Assessment", startStatus: "in-progress",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "type", label: "Assessment type", required: true, placeholder: "MEWS / NEWS2 / Braden / Falls / Pain" },
            { name: "ward", label: "Ward / Unit" },
            { name: "notes", label: "Clinical notes", type: "textarea" },
          ]},
        { key: "vitals", label: "Record Vitals Set", icon: HeartPulse, hint: "Capture a full observation set", kind: "Vitals", startStatus: "logged",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "bp", label: "BP" },
            { name: "hr", label: "Heart rate", type: "number" },
            { name: "temp", label: "Temperature" },
            { name: "spo2", label: "SpO₂ %", type: "number" },
          ]},
      ],
    },
    {
      key: "board",
      title: "Assessment Board",
      tagline: "Queue · progress",
      description: "Live board of open, in-progress and awaiting-review assessments.",
      icon: ListChecks,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "search", label: "Search Assessments", icon: Search, hint: "Filter by patient, ward or type", kind: "Search", startStatus: "active",
          fields: [
            { name: "query", label: "Search", required: true, placeholder: "Patient / MRN / type" },
          ]},
      ],
    },
    {
      key: "signoff",
      title: "Sign-off & Escalation",
      tagline: "Sign · escalate",
      description: "Countersign completed assessments or escalate high-acuity scores to the clinical response team.",
      icon: FileSignature,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "sign", label: "Countersign", icon: FileSignature, hint: "Countersign a completed assessment", kind: "Sign", startStatus: "signed",
          fields: [
            { name: "reference", label: "Assessment ref", required: true },
            { name: "signer", label: "Signer", required: true },
          ]},
        { key: "escalate", label: "Escalate", icon: ShieldAlert, hint: "Trigger a clinical response", kind: "Escalate", startStatus: "escalated",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "score", label: "Score / trigger", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
  ],
  businessFlow: {
    moduleKey: "clinical-assessments",
    title: "Clinical Assessment",
    purpose: "Run a structured clinical assessment against a patient, produce a defensible score, and hand off to the correct clinical response.",
    legacySource: "Rich/Clinical/Assessment.Implet; clinical.assessment.menu.xml",
    routeFamily: ["/clinical-assessments", "/clinical-assessments/new", "/clinical-assessments/{id}", "/clinical-assessments/{id}/sign"],
    patientRequired: true,
    completionKind: "Assessment",
    completionStatus: "completed",
    completionLabel: "Clinical assessment",
    titleFrom: (v) => `${v.type ?? "Assessment"} · ${v.patient ?? "Patient"}`,
    subtitleFrom: (v) => [v.ward, v.facility].filter(Boolean).join(" · "),
    events: [
      "AssessmentStarted", "AssessmentItemAnswered", "AssessmentScored",
      "AssessmentCompleted", "AssessmentSigned", "ClinicalResponseTriggered",
    ],
    handoffs: ["Medical Events", "Ward Management", "Case Management", "Pharmacy"],
    globalRules: [
      "Only trained roles may run scored assessments (facility-scoped).",
      "Each item stores value, unit and captured-by identity for audit.",
      "Trigger thresholds must be visible before submit.",
      "Countersign is required on high-acuity outcomes.",
      "All actions publish to the audit trail and Azure Service Bus.",
    ],
    acceptance: [
      "Run a MEWS assessment and score it correctly per item.",
      "Trigger a clinical response when threshold breached.",
      "Countersign and see the signed record in the timeline.",
    ],
    steps: [
      { key: "context", title: "Select patient and context", description: "Pick the patient, facility and clinical context for the assessment.",
        fields: [
          { name: "patient", label: "Patient", required: true, group: "Patient Selection" },
          { name: "mrn", label: "MRN", group: "Patient Selection" },
          { name: "admission", label: "Current admission", placeholder: "ADM-…", group: "Patient Selection" },
          { name: "patientStatus", label: "Patient status", type: "select", options: ["Ambulant", "Bed-bound", "Isolation", "Post-op", "Palliative"], group: "Patient Selection" },
          { name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"], hint: "Inherited from global facility — change requires override permission.", group: "Clinical Context" },
          { name: "ward", label: "Ward / Unit", required: true, group: "Clinical Context" },
          { name: "episode", label: "Episode of care", placeholder: "EOC-…", group: "Clinical Context" },
          { name: "assessmentAt", label: "Assessment date & time", placeholder: "YYYY-MM-DD HH:mm", group: "Clinical Context" },
          { name: "practitioner", label: "Responsible practitioner", required: true, placeholder: "Dr / RN name", group: "Clinical Context" },
        ]},
      { key: "type", title: "Choose assessment type", description: "Select the structured assessment to run.",
        fields: [{ name: "type", label: "Assessment", type: "select", required: true, options: ["MEWS", "NEWS2", "Braden Pressure", "Morse Falls", "Pain (NRS)", "Glasgow Coma Scale", "Custom facility form"] }],
        rules: ["Only assessments enabled for the facility are shown."] },
      { key: "vitals", title: "Capture vitals set", description: "Record the current observation set required by the chosen assessment.",
        fields: [
          { name: "bp", label: "Blood pressure", placeholder: "systolic/diastolic" },
          { name: "hr", label: "Heart rate", type: "number" },
          { name: "rr", label: "Respiratory rate", type: "number" },
          { name: "temp", label: "Temperature" },
          { name: "spo2", label: "SpO₂ %", type: "number" },
          { name: "avpu", label: "Consciousness (A/V/P/U)" },
        ] },
      { key: "items", title: "Answer scored items", description: "Answer each item in the form. The engine computes the score and shows thresholds live.",
        checklist: [
          "Each item answered or explicitly marked N/A",
          "Score visible and matches per-item points",
          "Threshold band displayed (Low / Moderate / High)",
        ] },
      { key: "notes", title: "Clinical notes and observations", description: "Add free-text observations and any decision context.",
        fields: [{ name: "notes", label: "Notes", type: "textarea", placeholder: "Clinical observations, decision rationale, patient response" }] },
      { key: "score", title: "Review computed score", description: "Confirm the computed score. Below-threshold results proceed to sign-off; above-threshold results require escalation.",
        events: ["AssessmentScored"] },
      { key: "response", title: "Choose clinical response", description: "For high-acuity outcomes, select the clinical response and target team.",
        fields: [
          { name: "response", label: "Response", type: "select", options: ["Continue routine care", "Increase observation frequency", "Escalate to RN/Ward Doctor", "Activate rapid response", "Activate resuscitation"] },
          { name: "responder", label: "Responder", placeholder: "Team / practitioner" },
        ],
        rules: ["High-acuity results cannot bypass escalation."] },
      { key: "sign", title: "Countersign and finalise", description: "Sign the completed assessment. Signed records are immutable and audit-linked.",
        fields: [{ name: "signer", label: "Countersigner", required: true }],
        events: ["AssessmentCompleted", "AssessmentSigned"] },
      { key: "publish", title: "Publish and audit", description: "Publish AssessmentCompleted to the service bus and write the audit record.",
        events: ["AssessmentCompleted", "ClinicalResponseTriggered"] },
    ],
  },
};

export const Route = createFileRoute("/_app/clinical-assessments")({
  head: () => ({
    meta: [
      { title: "Clinical Assessments — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
