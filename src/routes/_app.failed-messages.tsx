import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldAlert, RotateCcw, ClipboardCheck, Trash2, Search, FileWarning, Send,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "failed-messages",
  eyebrow: "Platform · Failed Messages",
  title: "Failed Messages",
  description: "Dead-letter queue triage — inspect payloads, replay after fix or discard poison with an audit note.",
  heroHeadline: "No poison left behind.",
  heroBlurb: "Every dead-lettered message lands here with its failure reason. Inspect, categorise, replay after fix or discard with sign-off.",
  heroBadge: "Live · Dead-letter",
  heroCtas: [
    { label: "Triage message", sectionKey: "triage", primary: true },
    { label: "Bulk replay", sectionKey: "recover" },
    { label: "Escalate", sectionKey: "escalate" },
  ],
  overviewKpis: (items) => [
    { label: "DLQ backlog", value: items.length, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    { label: "Awaiting triage", value: items.filter((i) => i.status === "dead-lettered").length, icon: FileWarning, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Replayed", value: items.filter((i) => i.status === "replayed").length, icon: RotateCcw, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Discarded", value: items.filter((i) => i.status === "discarded").length, icon: Trash2, accent: "from-muted/30 to-transparent", tone: "muted" },
  ],
  sections: [
    {
      key: "triage", title: "Triage", tagline: "Inspect · categorise",
      description: "Open a dead-letter, read the payload and failure reason and categorise the fault.",
      icon: Search, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "inspect", label: "Inspect Message", icon: Search, hint: "Open payload and failure reason", kind: "Inspect", startStatus: "dead-lettered",
          fields: [
            { name: "eventId", label: "Message ID", required: true },
            { name: "topic", label: "Topic" },
          ]},
        { key: "categorise", label: "Categorise", icon: ClipboardCheck, hint: "Tag with fault category", kind: "Categorise", startStatus: "categorised",
          fields: [
            { name: "eventId", label: "Message ID", required: true },
            { name: "category", label: "Category", placeholder: "Schema / Downstream / Poison / Config" },
          ]},
      ],
    },
    {
      key: "recover", title: "Recover", tagline: "Replay · discard",
      description: "Replay after fix, individually or in bulk. Discard poison with a sign-off.",
      icon: RotateCcw, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "replay", label: "Replay Message", icon: RotateCcw, hint: "Send back to active queue", kind: "Replay", startStatus: "replayed",
          fields: [
            { name: "eventId", label: "Message ID", required: true },
            { name: "note", label: "Replay note", type: "textarea" },
          ]},
        { key: "bulk-replay", label: "Bulk Replay", icon: Send, hint: "Replay all matching a filter", kind: "Bulk replay", startStatus: "replayed",
          fields: [
            { name: "topic", label: "Topic", required: true },
            { name: "category", label: "Category" },
          ]},
        { key: "discard", label: "Discard", icon: Trash2, hint: "Permanently discard poison", kind: "Discard", startStatus: "discarded",
          fields: [
            { name: "eventId", label: "Message ID", required: true },
            { name: "reason", label: "Reason", type: "textarea", required: true },
          ], destructive: true },
      ],
    },
    {
      key: "escalate", title: "Escalate", tagline: "Raise · assign",
      description: "Raise a bug to engineering or assign to a domain owner.",
      icon: ShieldAlert, accent: "from-amber-500/25 via-orange-500/15 to-transparent", ring: "ring-amber-400/30",
      actions: [
        { key: "raise-bug", label: "Raise Bug", icon: ShieldAlert, hint: "Create an engineering ticket", kind: "Bug", startStatus: "escalated",
          fields: [
            { name: "eventId", label: "Message ID", required: true },
            { name: "summary", label: "Summary", required: true },
            { name: "detail", label: "Detail", type: "textarea" },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "failed-messages",
    title: "DLQ Triage",
    purpose: "Turn poison messages into resolved incidents: inspect, categorise, fix upstream, replay or discard — with a defensible audit trail.",
    legacySource: "Rich/Platform/DeadLetter.Implet",
    routeFamily: ["/failed-messages", "/failed-messages/{id}"],
    completionKind: "Triage",
    completionStatus: "replayed",
    completionLabel: "Message resolved",
    titleFrom: (v) => `DLQ · ${v.topic ?? "Message"}`,
    subtitleFrom: (v) => v.category ?? v.eventId ?? "",
    events: ["MessageInspected", "MessageCategorised", "MessageReplayed", "MessageDiscarded", "BugRaised"],
    handoffs: ["Integrations", "Azure Service Bus Monitor", "Audit Trail"],
    globalRules: [
      "Every DLQ action is written to audit with actor and reason.",
      "Discard requires a written reason and elevated permission.",
      "Bulk replay batches respect throttle windows to avoid re-poisoning.",
      "Categorisation is required before replay so metrics stay meaningful.",
    ],
    acceptance: [
      "Inspect a DLQ message, view its payload and failure reason.",
      "Categorise, fix upstream and replay; message delivers successfully.",
      "Discard a poison message with reason; audit records the actor.",
    ],
    steps: [
      { key: "open", title: "Open dead-letter", description: "Select a message from the DLQ list.",
        fields: [
          { name: "eventId", label: "Message ID", required: true },
          { name: "topic", label: "Topic" },
        ] },
      { key: "inspect", title: "Inspect payload", description: "Read the payload, failure reason and attempt history.",
        checklist: ["Payload readable", "Failure reason understood", "Attempt count reviewed"],
        events: ["MessageInspected"] },
      { key: "categorise", title: "Categorise fault", description: "Tag as Schema / Downstream / Poison / Config.",
        fields: [{ name: "category", label: "Category", type: "select", options: ["Schema", "Downstream", "Poison", "Config"] }],
        events: ["MessageCategorised"] },
      { key: "fix", title: "Fix upstream", description: "Apply schema fix, code fix or config change; deploy.",
        fields: [{ name: "note", label: "Fix summary", type: "textarea" }] },
      { key: "decide", title: "Decide action", description: "Replay after fix, bulk-replay a matching set, or discard as poison.",
        rules: ["Replay only after fix is verified", "Discard requires sign-off"] },
      { key: "replay", title: "Replay to active queue", description: "Requeue with throttle and observe delivery.",
        events: ["MessageReplayed"] },
      { key: "verify", title: "Verify resolution", description: "Confirm no re-DLQ within the SLO window.",
        checklist: ["No re-DLQ", "Downstream acknowledged", "Correlation traced end-to-end"] },
      { key: "close", title: "Close incident", description: "Write the outcome to audit and close the triage.",
        events: ["MessageReplayed"] },
    ],
  },
};

export const Route = createFileRoute("/_app/failed-messages")({
  head: () => ({
    meta: [
      { title: "Failed Messages — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
