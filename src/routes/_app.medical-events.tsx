import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, HeartPulse, Syringe, AlertTriangle, ListChecks, PenLine,
  Radio, ShieldAlert, Search, ClipboardList,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "medical-events",
  patientScoped: true,
  eyebrow: "Patient Care · Medical Events",
  title: "Medical Events",
  description: "Capture, timeline and review clinical events across an episode of care — vitals, medications given, procedures, ADRs and incidents.",
  heroHeadline: "Every clinical event, in order, forever.",
  heroBlurb: "One authoritative event stream per patient. Capture at source, replay for coding and case review, and surface incidents to safety.",
  heroBadge: "Live · Event stream",
  heroCtas: [
    { label: "Record an event", sectionKey: "capture", primary: true },
    { label: "Open event timeline", sectionKey: "timeline" },
    { label: "Flag an incident", sectionKey: "safety" },
  ],
  overviewKpis: (items) => {
    const escalated = items.filter((i) => i.status === "escalated").length;
    const logged = items.filter((i) => i.status === "logged").length;
    const adr = items.filter((i) => String(i.fields["Kind"] ?? "").toLowerCase().includes("adr")).length;
    return [
      { label: "Events (24h)", value: items.length, icon: Activity, accent: "from-primary/30 to-transparent" },
      { label: "Logged", value: logged, icon: ClipboardList, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Escalated", value: escalated, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      { label: "ADRs flagged", value: adr, icon: AlertTriangle, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    ];
  },
  sections: [
    {
      key: "capture",
      title: "Event Capture",
      tagline: "At the bedside",
      description: "Record vitals, medications given, procedures and clinical observations against the patient's timeline.",
      icon: PenLine,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "vitals", label: "Record Vitals", icon: HeartPulse, hint: "Log an observation set", kind: "Vitals", startStatus: "logged",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "bp", label: "BP" }, { name: "hr", label: "HR", type: "number" },
            { name: "temp", label: "Temp" }, { name: "spo2", label: "SpO₂", type: "number" },
          ]},
        { key: "med-given", label: "Medication Given", icon: Syringe, hint: "Record a medication administration", kind: "Med Given", startStatus: "logged",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "drug", label: "Drug · dose · route", required: true },
            { name: "administered", label: "Administered by", required: true },
          ]},
        { key: "procedure", label: "Procedure Note", icon: ClipboardList, hint: "Record a procedure event", kind: "Procedure", startStatus: "logged",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "procedure", label: "Procedure", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "timeline",
      title: "Timeline & Review",
      tagline: "Replay · sign",
      description: "Filter and replay events per patient or per episode. Useful for case review, coding and morbidity meetings.",
      icon: ListChecks,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "search", label: "Search Events", icon: Search, hint: "Filter events", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true, placeholder: "Patient / kind / drug" }] },
      ],
    },
    {
      key: "safety",
      title: "Safety & Escalation",
      tagline: "ADR · incident",
      description: "Flag adverse drug reactions and safety incidents. Automatically routed to the safety and pharmacovigilance teams.",
      icon: ShieldAlert,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "adr", label: "Flag ADR", icon: AlertTriangle, hint: "Adverse drug reaction", kind: "ADR", startStatus: "escalated",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "drug", label: "Drug", required: true },
            { name: "reaction", label: "Reaction", required: true, type: "textarea" },
          ], destructive: true },
        { key: "incident", label: "Log Incident", icon: ShieldAlert, hint: "Safety incident", kind: "Incident", startStatus: "escalated",
          fields: [
            { name: "patient", label: "Patient" },
            { name: "type", label: "Incident type", required: true },
            { name: "details", label: "Details", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("medical-events", "Medical Events"),

  businessFlow: {
    moduleKey: "medical-events",
    title: "Record a Medical Event",
    purpose: "Capture a clinical event at source in a defensible, auditable way and hand off to any downstream module (coding, case, safety, pharmacy).",
    legacySource: "Rich/Clinical/MedicalEvent.Implet",
    routeFamily: ["/medical-events", "/medical-events/new", "/medical-events/{id}", "/patients/{id}/timeline"],
    patientRequired: true,
    completionKind: "Medical Event",
    completionStatus: "logged",
    completionLabel: "Medical event",
    titleFrom: (v) => `${v.kind ?? "Event"} · ${v.patient ?? "Patient"}`,
    subtitleFrom: (v) => [v.ward, v.facility].filter(Boolean).join(" · "),
    events: [
      "MedicalEventCaptured", "VitalsRecorded", "MedicationAdministered",
      "ProcedurePerformed", "AdverseReactionFlagged", "SafetyIncidentLogged",
    ],
    handoffs: ["Clinical Coding", "Case Management", "Pharmacy", "Ward Management", "Audit Trail"],
    globalRules: [
      "Every event must be tied to an authenticated caregiver.",
      "Time-of-event is captured separately from time-of-record.",
      "Adverse events auto-notify safety and pharmacovigilance.",
      "Editing after sign requires reason and preserves original.",
      "Every clinical event is automatically audited.",
    ],
    acceptance: [
      "Record a vitals set and see it on the patient's timeline.",
      "Log a medication administered against a prescribed order.",
      "Flag an ADR and confirm the safety team receives the notification.",
    ],
    steps: [
      { key: "context", title: "Select patient and encounter", description: "Pick the patient, encounter/episode and current ward context.",
        fields: [
          { name: "patient", label: "Patient", required: true },
          { name: "mrn", label: "MRN" },
          { name: "ward", label: "Ward / Unit" },
          { name: "encounter", label: "Encounter / Episode ID" },
        ]},
      { key: "kind", title: "Choose event kind", description: "What kind of event are you recording?",
        fields: [{ name: "kind", label: "Event kind", type: "select", required: true, options: ["Vitals set", "Medication administered", "Procedure performed", "Clinical note", "Adverse drug reaction", "Safety incident", "Fall", "Pressure sore observation"] }] },
      { key: "when", title: "When did the event happen?", description: "Capture the actual time of event, not the time of recording.",
        fields: [
          { name: "eventAt", label: "Event date / time", required: true, placeholder: "YYYY-MM-DD HH:mm" },
          { name: "location", label: "Location", placeholder: "Room / bed" },
        ],
        rules: ["Time-of-event and time-of-record are stored separately."] },
      { key: "detail", title: "Capture event detail", description: "Fill the structured detail required for this event kind.",
        fields: [
          { name: "detail", label: "Structured detail", type: "textarea", placeholder: "BP / drug / procedure / observation" },
          { name: "witness", label: "Witness (if required)" },
        ] },
      { key: "attachments", title: "Attach evidence", description: "Attach any images, ECGs, waveforms or documents supporting the event.",
        checklist: ["Photograph attached (if applicable)", "Waveform / trace attached (if applicable)", "Document / consent attached (if applicable)"] },
      { key: "clinical-review", title: "Clinical review flags", description: "Mark whether this event triggers coding, case review or safety.",
        fields: [
          { name: "codingReview", label: "Route to coding?", type: "select", options: ["No", "Yes"] },
          { name: "safetyReview", label: "Route to safety?", type: "select", options: ["No", "Yes"] },
        ] },
      { key: "sign", title: "Sign the event", description: "Signed events are immutable and audit-linked.",
        fields: [{ name: "signer", label: "Recording clinician", required: true }],
        events: ["MedicalEventCaptured"] },
    ],
  },
};

export const Route = createFileRoute("/_app/medical-events")({
  head: () => ({
    meta: [
      { title: "Medical Events — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
