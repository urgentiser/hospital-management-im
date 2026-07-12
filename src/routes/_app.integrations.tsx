import { createFileRoute } from "@tanstack/react-router";
import {
  Radio, Send, RotateCcw, ClipboardCheck, Search, ShieldAlert,
  Cable, Bug, Server,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { IntegrationsDetailTable } from "@/components/integrations-detail";

const config: ModuleConsoleConfig = {
  moduleKey: "integrations",
  eyebrow: "Platform · Integrations",
  title: "Integrations",
  description: "Live view of the event bus — inbound and outbound topics, retries, dead-letters and payload drill-downs.",
  heroHeadline: "The nervous system of Impilo.",
  heroBlurb: "Every domain event flows through the bus. Watch topics live, replay retries, resolve dead-letters and audit every hop.",
  heroBadge: "Live · Event bus",
  heroCtas: [
    { label: "Inspect topic", sectionKey: "monitor", primary: true },
    { label: "Retry event", sectionKey: "recover" },
    { label: "Register endpoint", sectionKey: "endpoints" },
  ],
  overviewKpis: (items) => [
    { label: "Events (24h)", value: items.length, icon: Radio, accent: "from-primary/30 to-transparent" },
    { label: "Delivered", value: items.filter((i) => i.status === "delivered").length, icon: Send, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Pending", value: items.filter((i) => i.status === "pending").length, icon: RotateCcw, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Dead-lettered", value: items.filter((i) => i.status === "deadletter" || i.status === "dead-lettered").length, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  overviewExtras: (items) => <IntegrationsDetailTable items={items} />,
  sections: [
    {
      key: "monitor", title: "Monitor Topics", tagline: "Live · trace",
      description: "Watch topics and subscriptions live, filter by correlation and drill into payloads.",
      icon: Radio, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "inspect-topic", label: "Inspect Topic", icon: Search, hint: "Peek recent messages on a topic", kind: "Inspect", startStatus: "pending",
          fields: [
            { name: "topic", label: "Topic", required: true, placeholder: "e.g. patient.admitted.v1" },
            { name: "subscription", label: "Subscription" },
            { name: "correlation", label: "Correlation ID" },
          ]},
        { key: "trace", label: "Trace Correlation", icon: ClipboardCheck, hint: "Follow a correlation across topics", kind: "Trace", startStatus: "pending",
          fields: [{ name: "correlation", label: "Correlation ID", required: true }] },
      ],
    },
    {
      key: "recover", title: "Retry & Recover", tagline: "Replay · resolve",
      description: "Retry pending events, replay from dead-letter and mark messages resolved.",
      icon: RotateCcw, accent: "from-amber-500/25 via-orange-500/15 to-transparent", ring: "ring-amber-400/30",
      actions: [
        { key: "retry", label: "Retry Event", icon: RotateCcw, hint: "Requeue an event for delivery", kind: "Retry", startStatus: "pending",
          fields: [
            { name: "eventId", label: "Event ID", required: true },
            { name: "reason", label: "Reason", type: "textarea" },
          ]},
        { key: "resolve", label: "Resolve Event", icon: ClipboardCheck, hint: "Mark event as resolved without replay", kind: "Resolve", startStatus: "delivered",
          fields: [
            { name: "eventId", label: "Event ID", required: true },
            { name: "note", label: "Resolution note", type: "textarea", required: true },
          ]},
        { key: "deadletter", label: "Send to DLQ", icon: ShieldAlert, hint: "Route poison message to dead-letter", kind: "Dead-letter", startStatus: "deadletter",
          fields: [
            { name: "eventId", label: "Event ID", required: true },
            { name: "reason", label: "Reason", type: "textarea", required: true },
          ], destructive: true },
      ],
    },
    {
      key: "endpoints", title: "Endpoints & Contracts", tagline: "Register · validate",
      description: "Register connected systems and validate event schema contracts.",
      icon: Cable, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "register", label: "Register Endpoint", icon: Server, hint: "Add a new inbound or outbound endpoint", kind: "Endpoint", startStatus: "active",
          fields: [
            { name: "system", label: "System", required: true, placeholder: "Discovery / MedScheme / SAP" },
            { name: "direction", label: "Direction", placeholder: "inbound / outbound" },
            { name: "url", label: "Endpoint URL" },
          ]},
        { key: "validate", label: "Validate Contract", icon: Bug, hint: "Run schema validation on a topic", kind: "Contract", startStatus: "verified",
          fields: [
            { name: "topic", label: "Topic", required: true },
            { name: "version", label: "Version" },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "integrations",
    title: "Publish · Retry · Resolve",
    purpose: "Every domain event travels the bus reliably. Publish, monitor, retry on transient failure, dead-letter on poison, then resolve or replay.",
    legacySource: "Rich/Integrations/ServiceBus.Implet; integrations.menu.xml",
    routeFamily: ["/integrations", "/integrations/{topic}", "/integrations/dlq", "/integrations/endpoints"],
    completionKind: "Event",
    completionStatus: "delivered",
    completionLabel: "Event resolved",
    titleFrom: (v) => `${v.topic ?? "Event"} · ${v.correlation ?? ""}`,
    subtitleFrom: (v) => [v.subscription, v.system].filter(Boolean).join(" · "),
    events: [
      "EventPublished", "EventDelivered", "EventRetried", "EventDeadLettered",
      "EventResolved", "EndpointRegistered", "ContractValidated",
    ],
    handoffs: ["Failed Messages", "Audit Trail", "System Health"],
    globalRules: [
      "Every publish is idempotent — a message ID identifies duplicates.",
      "Retry with exponential backoff; abandon to DLQ after configured max attempts.",
      "Every payload is schema-validated against the topic contract.",
      "Correlation IDs must be preserved end-to-end.",
      "Every action publishes to the audit stream.",
    ],
    acceptance: [
      "Publish an event, see it delivered and traced by correlation ID.",
      "Inject a transient failure and observe retry then delivery.",
      "Route a poison message to DLQ and resolve or replay it.",
    ],
    steps: [
      { key: "publish", title: "Publish event", description: "A domain module publishes an event with correlation ID and payload.",
        fields: [
          { name: "topic", label: "Topic", required: true },
          { name: "correlation", label: "Correlation ID", required: true },
          { name: "payload", label: "Payload preview", type: "textarea" },
        ], events: ["EventPublished"] },
      { key: "validate", title: "Schema validation", description: "The bus validates the payload against the registered contract.",
        checklist: ["Contract version matches", "Required fields present", "No unknown fields at strict endpoints"] },
      { key: "deliver", title: "Deliver to subscribers", description: "Each subscription receives a copy and acknowledges.",
        fields: [{ name: "subscription", label: "Subscription" }], events: ["EventDelivered"] },
      { key: "retry", title: "Retry on failure", description: "Transient failures retry with backoff.",
        fields: [{ name: "attempts", label: "Attempts", type: "number" }],
        rules: ["Max attempts respected", "Backoff bounded"], events: ["EventRetried"] },
      { key: "dlq", title: "Dead-letter poison", description: "Persistent failures move to the DLQ with the failure reason.",
        fields: [{ name: "reason", label: "Failure reason", type: "textarea" }], events: ["EventDeadLettered"] },
      { key: "triage", title: "Triage from DLQ", description: "Operators inspect payloads and decide to resolve, replay or discard.",
        checklist: ["Payload inspected", "Root cause identified", "Ticket raised if code fix required"] },
      { key: "replay", title: "Replay or resolve", description: "Replay after fix or resolve manually with a note.",
        fields: [{ name: "note", label: "Resolution note", type: "textarea" }],
        events: ["EventResolved"] },
      { key: "audit", title: "Audit & metrics", description: "All hops are written to audit and update the health dashboards.",
        events: ["EventResolved"] },
    ],
  },
};

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
