import { createFileRoute } from "@tanstack/react-router";
import {
  Radio, Send, ClipboardCheck, ShieldAlert, RefreshCw, Pause, PlayCircle, Layers, Gauge,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "service-bus",
  eyebrow: "Platform · Azure Service Bus",
  title: "Azure Service Bus Monitor",
  description: "Queue, topic and subscription telemetry — throughput, lag, dead-letter counts and consumer health.",
  heroHeadline: "Every queue, every subscription, in one glass.",
  heroBlurb: "Watch consumer lag, throttle noisy topics, pause runaway subscribers and requeue dead-letters with full traceability.",
  heroBadge: "Live · Azure Service Bus",
  heroCtas: [
    { label: "Inspect subscription", sectionKey: "monitor", primary: true },
    { label: "Requeue DLQ", sectionKey: "recover" },
    { label: "Manage capacity", sectionKey: "capacity" },
  ],
  overviewKpis: (items) => [
    { label: "Subscriptions", value: items.length, icon: Layers, accent: "from-primary/30 to-transparent" },
    { label: "Healthy", value: items.filter((i) => i.status === "healthy").length, icon: Gauge, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Degraded", value: items.filter((i) => i.status === "degraded").length, icon: RefreshCw, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "DLQ backlog", value: items.reduce((n, i) => n + Number(i.fields["DLQ"] ?? 0), 0), icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "monitor", title: "Monitor", tagline: "Topics · subscriptions",
      description: "Inspect a subscription live — messages, lag and dead-letters.",
      icon: Radio, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "inspect-sub", label: "Inspect Subscription", icon: Radio, hint: "Peek current lag and message counts", kind: "Subscription", startStatus: "healthy",
          fields: [
            { name: "topic", label: "Topic", required: true },
            { name: "subscription", label: "Subscription", required: true },
          ]},
        { key: "peek", label: "Peek Messages", icon: Send, hint: "Peek without consuming", kind: "Peek", startStatus: "healthy",
          fields: [
            { name: "subscription", label: "Subscription", required: true },
            { name: "count", label: "Count", type: "number" },
          ]},
      ],
    },
    {
      key: "recover", title: "Recover", tagline: "Requeue · resolve",
      description: "Move dead-letters back to the active queue or discard with an audit note.",
      icon: RefreshCw, accent: "from-amber-500/25 via-orange-500/15 to-transparent", ring: "ring-amber-400/30",
      actions: [
        { key: "requeue", label: "Requeue DLQ", icon: RefreshCw, hint: "Move DLQ messages back to active", kind: "Requeue", startStatus: "healthy",
          fields: [
            { name: "subscription", label: "Subscription", required: true },
            { name: "count", label: "How many", type: "number" },
            { name: "reason", label: "Reason", type: "textarea" },
          ]},
        { key: "discard", label: "Discard DLQ", icon: ShieldAlert, hint: "Discard poison messages", kind: "Discard", startStatus: "discarded",
          fields: [
            { name: "subscription", label: "Subscription", required: true },
            { name: "reason", label: "Reason", type: "textarea", required: true },
          ], destructive: true },
      ],
    },
    {
      key: "capacity", title: "Capacity & Flow", tagline: "Pause · resume",
      description: "Throttle noisy producers, pause runaway consumers and audit changes.",
      icon: Gauge, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "pause", label: "Pause Subscription", icon: Pause, hint: "Temporarily pause a subscriber", kind: "Pause", startStatus: "paused",
          fields: [
            { name: "subscription", label: "Subscription", required: true },
            { name: "reason", label: "Reason", required: true },
          ], destructive: true },
        { key: "resume", label: "Resume Subscription", icon: PlayCircle, hint: "Resume a paused subscriber", kind: "Resume", startStatus: "healthy",
          fields: [{ name: "subscription", label: "Subscription", required: true }] },
        { key: "audit", label: "Audit Change", icon: ClipboardCheck, hint: "Log a configuration change", kind: "Config", startStatus: "logged",
          fields: [
            { name: "subscription", label: "Subscription", required: true },
            { name: "change", label: "Change", type: "textarea", required: true },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "service-bus",
    title: "Detect · Contain · Recover",
    purpose: "Keep the Azure Service Bus healthy: detect lag or DLQ growth, contain runaway subscribers, recover backlog safely, and audit every operator action.",
    legacySource: "Rich/Platform/ServiceBusMonitor.Implet",
    routeFamily: ["/service-bus", "/service-bus/{topic}/{sub}", "/service-bus/dlq"],
    completionKind: "Recovery",
    completionStatus: "healthy",
    completionLabel: "Bus recovered",
    titleFrom: (v) => `${v.topic ?? "Topic"} / ${v.subscription ?? "Subscription"}`,
    subtitleFrom: (v) => v.reason ?? "",
    events: ["LagDetected", "SubscriptionPaused", "DLQRequeued", "DLQDiscarded", "SubscriptionResumed", "ConfigChanged"],
    handoffs: ["Integrations", "Failed Messages", "System Health"],
    globalRules: [
      "Every operator action is written to audit with actor, reason and correlation.",
      "Pausing a subscription requires a reason; resume requires operator sign-off.",
      "Discarding DLQ messages is destructive and requires elevated permission.",
      "Requeue batches respect a maximum-per-minute throttle.",
    ],
    acceptance: [
      "Detect a subscription with rising lag and see it appear as degraded.",
      "Pause the subscription, drain the backlog, then resume.",
      "Requeue DLQ messages back to the active subscription and observe delivery.",
    ],
    steps: [
      { key: "detect", title: "Detect anomaly", description: "Lag, DLQ growth or throughput drop appears on the dashboard.",
        fields: [
          { name: "topic", label: "Topic", required: true },
          { name: "subscription", label: "Subscription", required: true },
          { name: "signal", label: "Signal", type: "select", options: ["Lag rising", "DLQ growth", "Throughput drop", "Consumer errors"] },
        ], events: ["LagDetected"] },
      { key: "inspect", title: "Inspect messages", description: "Peek recent messages and DLQ contents without consuming.",
        checklist: ["Peeked active queue", "Peeked DLQ", "Identified failing consumer"] },
      { key: "contain", title: "Contain runaway", description: "Pause the subscriber if it is looping or failing.",
        fields: [{ name: "reason", label: "Pause reason", required: true }],
        events: ["SubscriptionPaused"] },
      { key: "diagnose", title: "Diagnose root cause", description: "Correlate with service health, recent deploys and downstream endpoints.",
        rules: ["Cross-reference System Health", "Check recent releases", "Consult on-call runbook"] },
      { key: "fix", title: "Apply fix", description: "Fix consumer bug, scale out, or update the contract; deploy.",
        fields: [{ name: "change", label: "Change applied", type: "textarea" }],
        events: ["ConfigChanged"] },
      { key: "requeue", title: "Requeue DLQ", description: "Return dead-lettered messages to the active queue in throttled batches.",
        fields: [{ name: "count", label: "Batch size", type: "number" }],
        events: ["DLQRequeued"] },
      { key: "resume", title: "Resume subscription", description: "Bring the subscriber back online and drain backlog.",
        events: ["SubscriptionResumed"] },
      { key: "verify", title: "Verify health", description: "Confirm lag drops to normal, DLQ stable and no new errors for the SLO window.",
        checklist: ["Lag under target", "DLQ not growing", "Error rate baseline"] },
    ],
  },
};

export const Route = createFileRoute("/_app/service-bus")({
  head: () => ({
    meta: [
      { title: "Azure Service Bus Monitor — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
