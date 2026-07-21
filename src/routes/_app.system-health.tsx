import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, Gauge, ShieldAlert, ClipboardCheck, RotateCcw, PlayCircle, Bell, HeartPulse,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "system-health",
  platformScoped: true,
  eyebrow: "Platform · System Health",
  title: "System Health",
  description: "Service uptime, dependency status, SLO burn and platform incidents — with runbook shortcuts.",
  heroHeadline: "Green means green. Everywhere.",
  heroBlurb: "Track SLOs, dependencies and error budgets. When something breaks, jump straight to the runbook.",
  heroBadge: "Live · SRE",
  heroCtas: [
    { label: "Trigger probe", sectionKey: "probes", primary: true },
    { label: "Open incident", sectionKey: "incidents" },
    { label: "Runbooks", sectionKey: "runbooks" },
  ],
  overviewKpis: (items) => [
    { label: "Services", value: items.length, icon: Activity, accent: "from-primary/30 to-transparent" },
    { label: "Healthy", value: items.filter((i) => i.status === "healthy").length, icon: HeartPulse, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Degraded", value: items.filter((i) => i.status === "degraded").length, icon: Gauge, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Down", value: items.filter((i) => i.status === "down").length, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "probes", title: "Probes & Checks", tagline: "Run · verify",
      description: "Run synthetic and dependency probes on demand.",
      icon: HeartPulse, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "run-probe", label: "Run Probe", icon: PlayCircle, hint: "Run a synthetic probe now", kind: "Probe", startStatus: "healthy",
          fields: [
            { name: "service", label: "Service", required: true },
            { name: "probe", label: "Probe", placeholder: "http / tcp / synthetic" },
          ]},
        { key: "dependency-check", label: "Dependency Check", icon: ClipboardCheck, hint: "Verify downstream dependencies", kind: "Dependency", startStatus: "healthy",
          fields: [
            { name: "service", label: "Service", required: true },
          ]},
      ],
    },
    {
      key: "incidents", title: "Incidents", tagline: "Declare · resolve",
      description: "Declare an incident, page the on-call and resolve with a timeline.",
      icon: ShieldAlert, accent: "from-rose-500/25 via-pink-500/15 to-transparent", ring: "ring-rose-400/30",
      actions: [
        { key: "declare", label: "Declare Incident", icon: ShieldAlert, hint: "Open a new incident", kind: "Incident", startStatus: "open",
          fields: [
            { name: "service", label: "Service", required: true },
            { name: "severity", label: "Severity", placeholder: "Sev1 / Sev2 / Sev3" },
            { name: "summary", label: "Summary", required: true },
          ], destructive: true },
        { key: "page", label: "Page On-call", icon: Bell, hint: "Page the on-call rotation", kind: "Page", startStatus: "paged",
          fields: [
            { name: "rotation", label: "Rotation", required: true },
            { name: "note", label: "Note" },
          ]},
        { key: "resolve", label: "Resolve Incident", icon: ClipboardCheck, hint: "Close with resolution", kind: "Resolve Incident", startStatus: "resolved",
          fields: [
            { name: "incidentId", label: "Incident ID", required: true },
            { name: "resolution", label: "Resolution", type: "textarea", required: true },
          ]},
      ],
    },
    {
      key: "runbooks", title: "Runbooks", tagline: "Follow · learn",
      description: "Open the operational runbook for a service and track execution.",
      icon: RotateCcw, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "run-runbook", label: "Execute Runbook", icon: PlayCircle, hint: "Run a documented remediation", kind: "Runbook", startStatus: "in-progress",
          fields: [
            { name: "service", label: "Service", required: true },
            { name: "runbook", label: "Runbook", required: true },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "system-health",
    title: "Detect · Diagnose · Restore",
    purpose: "Detect service degradation early, diagnose with runbooks and dependency data, restore quickly and learn from every incident.",
    legacySource: "Rich/Platform/SystemHealth.Implet",
    routeFamily: ["/system-health", "/system-health/{service}", "/system-health/incidents"],
    completionKind: "Incident",
    completionStatus: "resolved",
    completionLabel: "Incident resolved",
    titleFrom: (v) => `${v.service ?? "Service"} · ${v.severity ?? "Health"}`,
    subtitleFrom: (v) => v.summary ?? v.probe ?? "",
    events: ["ProbeRun", "IncidentDeclared", "OnCallPaged", "RunbookExecuted", "IncidentResolved", "PostmortemFiled"],
    handoffs: ["Azure Service Bus Monitor", "Failed Messages", "Audit Trail", "Notifications"],
    globalRules: [
      "SLOs drive alerting; error budgets are visible to all engineers.",
      "Sev1/Sev2 auto-page the on-call rotation.",
      "Every incident produces a written resolution and, above Sev3, a postmortem.",
      "Runbook executions are audited step-by-step.",
    ],
    acceptance: [
      "Trigger a synthetic probe and see a green result on the dashboard.",
      "Declare an incident, page on-call and record a resolution.",
      "Execute a runbook step-by-step and verify each check.",
    ],
    steps: [
      { key: "signal", title: "Signal received", description: "SLO burn, probe failure or user report triggers investigation.",
        fields: [
          { name: "service", label: "Service", required: true },
          { name: "probe", label: "Signal", placeholder: "SLO burn / probe / user report" },
        ], events: ["ProbeRun"] },
      { key: "triage", title: "Triage", description: "Confirm scope and severity.",
        fields: [{ name: "severity", label: "Severity", type: "select", options: ["Sev1", "Sev2", "Sev3", "Sev4"] }] },
      { key: "declare", title: "Declare incident", description: "Open the incident record; page on-call for Sev1/Sev2.",
        fields: [{ name: "summary", label: "Summary", required: true }],
        events: ["IncidentDeclared", "OnCallPaged"] },
      { key: "diagnose", title: "Diagnose", description: "Follow the runbook. Check dependencies, recent deploys and error signatures.",
        checklist: ["Runbook opened", "Dependencies checked", "Recent releases reviewed"] },
      { key: "mitigate", title: "Mitigate", description: "Apply the fastest safe remediation — rollback, scale, feature-flag off.",
        fields: [{ name: "action", label: "Mitigation applied", type: "textarea" }],
        events: ["RunbookExecuted"] },
      { key: "verify", title: "Verify restoration", description: "Confirm probes green and error budget stable for the SLO window.",
        checklist: ["Probes green", "Error rate baseline", "No new pages"] },
      { key: "resolve", title: "Resolve", description: "Close the incident with a written resolution.",
        fields: [{ name: "resolution", label: "Resolution", type: "textarea", required: true }],
        events: ["IncidentResolved"] },
      { key: "postmortem", title: "Postmortem", description: "Sev1/Sev2 require a written postmortem within 5 business days.",
        events: ["PostmortemFiled"] },
    ],
  },
};

export const Route = createFileRoute("/_app/system-health")({
  head: () => ({
    meta: [
      { title: "System Health — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
