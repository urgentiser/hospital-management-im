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
