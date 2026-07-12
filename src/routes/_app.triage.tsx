import { createFileRoute } from "@tanstack/react-router";
import {
  Stethoscope, ListChecks, HeartPulse, Activity, ClipboardList,
  Clock, ShieldAlert, ChevronsUp,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "triage",
  eyebrow: "Clinical · Emergency Unit",
  title: "Triage",
  description: "Rapid ESI-based triage, acuity board and treatment hand-off for the Emergency Unit.",
  heroHeadline: "Every arrival scored, tracked and routed in seconds.",
  heroBlurb: "Capture presenting complaint, vitals and ESI acuity — then keep sight of the queue until treatment is complete.",
  heroBadge: "Live · ESI board",
  heroCtas: [
    { label: "Triage a patient", sectionKey: "intake", primary: true },
    { label: "Open triage list", sectionKey: "board" },
  ],
  overviewKpis: (items) => {
    const waiting = items.filter((i) => i.status === "waiting").length;
    const inProgress = items.filter((i) => i.status === "in-progress").length;
    const critical = items.filter((i) => String(i.fields["ESI"] ?? "") === "1" || String(i.fields["ESI"] ?? "") === "2").length;
    const closed = items.filter((i) => i.status === "closed" || i.status === "discharged").length;
    return [
      { label: "Waiting", value: waiting, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "In treatment", value: inProgress, icon: Activity, accent: "from-sky-500/30 to-transparent" },
      { label: "High acuity (ESI 1–2)", value: critical, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      { label: "Completed", value: closed, icon: HeartPulse, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    ];
  },
  sectionKpis: (section, items) => {
    if (section.key === "intake") {
      return [
        { label: "New today", value: items.filter((i) => new Date(i.createdAt).toDateString() === new Date().toDateString()).length, icon: Stethoscope, accent: "from-primary/30 to-transparent" },
        { label: "Escalated", value: items.filter((i) => String(i.fields["ESI"] ?? "") === "1").length, icon: ChevronsUp, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      ];
    }
    return [
      { label: "On board", value: items.length, icon: ListChecks, accent: "from-primary/30 to-transparent" },
      { label: "Waiting", value: items.filter((i) => i.status === "waiting").length, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    ];
  },
  sections: [
    {
      key: "intake",
      title: "Triage Intake",
      tagline: "Assess · score · route",
      description: "Capture a new triage encounter with complaint, vitals and ESI acuity.",
      icon: Stethoscope,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "triage-patient", label: "Triage Patient", icon: Stethoscope, hint: "Score acuity and start treatment path", kind: "Triage Patient", startStatus: "waiting",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "facility", label: "Facility", required: true },
            { name: "complaint", label: "Presenting complaint", required: true, type: "textarea" },
            { name: "esi", label: "ESI (1–5)", type: "number", required: true, placeholder: "1 = resuscitation" },
            { name: "vitals", label: "Vitals (BP · HR · Temp · SpO₂)" },
          ]},
        { key: "escalate", label: "Escalate Acuity", icon: ChevronsUp, hint: "Upgrade ESI or activate clinical response", kind: "Escalate", startStatus: "in-progress",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "esi", label: "New ESI", type: "number", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "board",
      title: "Triage Board",
      tagline: "Queue · progress · closeout",
      description: "Live board of everyone currently triaged, with quick actions to progress or close.",
      icon: ListChecks,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "triage-list", label: "Triage List", icon: ListChecks, hint: "Open the live triage queue", kind: "Triage List", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "period", label: "Shift" },
          ]},
        { key: "close", label: "Close Encounter", icon: ClipboardList, hint: "Complete or discharge from triage", kind: "Close Encounter", startStatus: "closed",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "outcome", label: "Outcome", placeholder: "Admitted / Discharged / Referred" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "triage",
    title: "Emergency Triage",
    purpose: "Score arriving patients with the Emergency Severity Index, route them to the right stream and hand off treatment without losing sight of the queue.",
    legacySource: "Rich/Emergency/Triage.Implet; emergency.triage.menu.xml",
    routeFamily: ["/triage", "/triage/new", "/triage/{id}", "/triage/board"],
    patientRequired: true,
    completionKind: "Triage Patient",
    completionStatus: "waiting",
    completionLabel: "Triage encounter",
    titleFrom: (v) => `${v.patient ?? "Patient"} · ESI ${v.esi ?? "?"}`,
    subtitleFrom: (v) => [v.facility, v.complaint].filter(Boolean).join(" · "),
    events: [
      "TriageArrived", "TriageAssessed", "TriageScored",
      "TriageEscalated", "TriageStreamed", "TriageClosed",
    ],
    handoffs: ["Admissions", "Ward Management", "Medical Events", "Case Management"],
    globalRules: [
      "Only credentialled triage nurses/doctors may score acuity.",
      "ESI 1–2 patients bypass queueing and go directly to resus.",
      "Every score change must record the reason and be signed.",
      "Time-to-first-provider is measured from arrival, not from record creation.",
      "The board is facility-scoped; national views require elevated permission.",
    ],
    acceptance: [
      "Register an arriving patient, capture vitals and score ESI 3.",
      "Escalate an ESI 3 to ESI 2 with reason and see the audit chip.",
      "Close a triage encounter as Admitted, generating the admission handoff.",
    ],
    steps: [
      { key: "arrival", title: "Register arrival", description: "Capture arrival time, mode of arrival and identity.",
        fields: [
          { name: "patient", label: "Patient", required: true },
          { name: "mrn", label: "MRN (if known)" },
          { name: "arrivedAt", label: "Arrival time", placeholder: "HH:mm" },
          { name: "arrivalMode", label: "Mode", type: "select", options: ["Walk-in", "Ambulance", "Referral", "Inter-hospital"] },
          { name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] },
        ],
        events: ["TriageArrived"] },
      { key: "complaint", title: "Presenting complaint", description: "Capture presenting complaint and pertinent history in the patient's own words.",
        fields: [
          { name: "complaint", label: "Presenting complaint", required: true, type: "textarea" },
          { name: "history", label: "Brief history", type: "textarea" },
          { name: "allergies", label: "Known allergies" },
        ] },
      { key: "vitals", title: "Vitals & primary survey", description: "Capture the first observation set and the ABCDE primary survey.",
        fields: [
          { name: "bp", label: "BP" }, { name: "hr", label: "HR", type: "number" },
          { name: "rr", label: "RR", type: "number" }, { name: "temp", label: "Temp" },
          { name: "spo2", label: "SpO₂", type: "number" }, { name: "avpu", label: "AVPU" },
          { name: "pain", label: "Pain (0-10)", type: "number" },
        ],
        checklist: ["Airway assessed", "Breathing assessed", "Circulation assessed", "Disability assessed", "Exposure controlled"] },
      { key: "esi", title: "Assign ESI acuity", description: "Score Emergency Severity Index 1 (resus) → 5 (non-urgent).",
        fields: [
          { name: "esi", label: "ESI", type: "select", required: true, options: ["1 — Resuscitation", "2 — Emergent", "3 — Urgent", "4 — Less urgent", "5 — Non-urgent"] },
          { name: "reason", label: "Reason for score", type: "textarea" },
        ],
        events: ["TriageAssessed", "TriageScored"],
        rules: ["ESI 1–2 must trigger immediate resus notification."] },
      { key: "stream", title: "Stream to treatment area", description: "Route the patient to Resus / Majors / Minors / Fast-track / Paeds.",
        fields: [{ name: "stream", label: "Treatment stream", type: "select", required: true, options: ["Resus", "Majors", "Minors", "Fast-track", "Paediatrics", "OB triage"] }],
        events: ["TriageStreamed"] },
      { key: "waiting", title: "Board & wait tracking", description: "Patient appears on the acuity board. Wait time is measured to first provider.",
        checklist: ["Board updated", "Wait timer started", "Family notified of stream"] },
      { key: "reassess", title: "Reassessment cadence", description: "ESI 2 patients reassess every 15 min, ESI 3 every 30 min, ESI 4-5 every 60 min.",
        fields: [{ name: "reassessNote", label: "Latest reassessment note", type: "textarea" }] },
      { key: "escalate", title: "Escalation (if needed)", description: "Upgrade ESI or activate rapid response with a documented reason.",
        fields: [
          { name: "escalation", label: "Escalation", type: "select", options: ["None", "Upgrade to ESI 2", "Upgrade to ESI 1", "Activate rapid response", "Activate MET"] },
          { name: "escalationReason", label: "Reason", type: "textarea" },
        ],
        events: ["TriageEscalated"] },
      { key: "outcome", title: "Close encounter", description: "Set the outcome and generate the correct handoff.",
        fields: [
          { name: "outcome", label: "Outcome", type: "select", required: true, options: ["Admitted", "Discharged", "Referred", "Left without being seen", "Deceased"] },
          { name: "notes", label: "Closing notes", type: "textarea" },
        ],
        events: ["TriageClosed"] },
      { key: "publish", title: "Publish and audit", description: "Publish TriageClosed and hand off to Admissions/Ward/Case as needed.",
        events: ["TriageClosed"] },
    ],
  },
};

export const Route = createFileRoute("/_app/triage")({
  head: () => ({
    meta: [
      { title: "Triage — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
