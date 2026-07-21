import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, Send, ClipboardCheck, RotateCcw, Ban, FileText, MailCheck, Mail, MessageSquare,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "notifications",
  platformScoped: true,
  eyebrow: "Platform · Notifications",
  title: "Notifications",
  description: "Templates, channels and delivery status for every SMS, email and in-app message the platform sends.",
  heroHeadline: "The right message. The right channel. Every time.",
  heroBlurb: "Design templates, target audiences, monitor delivery and retry failures — with opt-out and consent respected everywhere.",
  heroBadge: "Live · Notify",
  heroCtas: [
    { label: "Send notification", sectionKey: "send", primary: true },
    { label: "Manage templates", sectionKey: "templates" },
    { label: "Retry failures", sectionKey: "recover" },
  ],
  overviewKpis: (items) => [
    { label: "Sent (24h)", value: items.length, icon: Bell, accent: "from-primary/30 to-transparent" },
    { label: "Delivered", value: items.filter((i) => i.status === "delivered").length, icon: MailCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Queued", value: items.filter((i) => i.status === "queued").length, icon: Send, accent: "from-sky-500/30 to-transparent" },
    { label: "Failed", value: items.filter((i) => i.status === "failed").length, icon: Ban, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "send", title: "Send", tagline: "SMS · Email · Push",
      description: "Send a transactional message or a targeted broadcast.",
      icon: Send, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "send-sms", label: "Send SMS", icon: MessageSquare, hint: "One SMS from a template", kind: "SMS", startStatus: "queued",
          fields: [
            { name: "recipient", label: "Recipient", required: true },
            { name: "template", label: "Template", required: true },
            { name: "variables", label: "Variables", type: "textarea" },
          ]},
        { key: "send-email", label: "Send Email", icon: Mail, hint: "One email from a template", kind: "Email", startStatus: "queued",
          fields: [
            { name: "recipient", label: "Recipient", required: true },
            { name: "template", label: "Template", required: true },
            { name: "subject", label: "Subject override" },
          ]},
        { key: "broadcast", label: "Broadcast", icon: Bell, hint: "Send to an audience", kind: "Broadcast", startStatus: "queued",
          fields: [
            { name: "audience", label: "Audience", required: true, placeholder: "e.g. Facility Fourways · Case Managers" },
            { name: "template", label: "Template", required: true },
          ]},
      ],
    },
    {
      key: "templates", title: "Templates", tagline: "Design · approve",
      description: "Author templates with variables, preview and route through approval.",
      icon: FileText, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "new-template", label: "New Template", icon: FileText, hint: "Create a new template", kind: "Template", startStatus: "draft",
          fields: [
            { name: "name", label: "Template name", required: true },
            { name: "channel", label: "Channel", placeholder: "SMS / Email / Push" },
            { name: "body", label: "Body", type: "textarea", required: true },
          ]},
        { key: "approve-template", label: "Approve Template", icon: ClipboardCheck, hint: "Sign off a draft template", kind: "Approve Template", startStatus: "approved",
          fields: [
            { name: "name", label: "Template name", required: true },
            { name: "approver", label: "Approver", required: true },
          ]},
      ],
    },
    {
      key: "recover", title: "Retry & Suppress", tagline: "Recover · consent",
      description: "Retry failures and manage opt-outs and consent.",
      icon: RotateCcw, accent: "from-amber-500/25 via-orange-500/15 to-transparent", ring: "ring-amber-400/30",
      actions: [
        { key: "retry", label: "Retry Failed", icon: RotateCcw, hint: "Requeue failed sends", kind: "Retry", startStatus: "queued",
          fields: [
            { name: "messageId", label: "Message ID", required: true },
          ]},
        { key: "suppress", label: "Suppress Recipient", icon: Ban, hint: "Honour an opt-out", kind: "Suppress", startStatus: "suppressed",
          fields: [
            { name: "recipient", label: "Recipient", required: true },
            { name: "reason", label: "Reason", required: true },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("notifications", "Notifications"),

  businessFlow: {
    moduleKey: "notifications",
    title: "Compose · Send · Deliver",
    purpose: "Notify the right person on the right channel at the right time — with consent, delivery guarantees and audit built in.",
    legacySource: "Rich/Platform/Notifications.Implet",
    routeFamily: ["/notifications", "/notifications/templates", "/notifications/{id}"],
    completionKind: "Notification",
    completionStatus: "delivered",
    completionLabel: "Notification delivered",
    titleFrom: (v) => `${v.channel ?? "Message"} · ${v.recipient ?? ""}`,
    subtitleFrom: (v) => v.template ?? "",
    events: ["NotificationQueued", "NotificationSent", "NotificationDelivered", "NotificationFailed", "RecipientSuppressed", "TemplateApproved"],
    handoffs: ["Audit Trail", "Users & Permissions", "System Health"],
    globalRules: [
      "Every send checks consent and suppression before dispatch.",
      "Templates require approval before use in production.",
      "PII in variables is masked in logs.",
      "Failed sends retry on backoff and dead-letter after configured max attempts.",
    ],
    acceptance: [
      "Send a transactional SMS from an approved template; delivery updates within seconds.",
      "Attempt to send to a suppressed recipient; system refuses with an audit entry.",
      "Retry a failed message and see delivery success.",
    ],
    steps: [
      { key: "template", title: "Pick template", description: "Pick an approved template. Templates carry consent metadata.",
        fields: [
          { name: "template", label: "Template", required: true },
          { name: "channel", label: "Channel", type: "select", options: ["SMS", "Email", "Push", "In-app"] },
        ] },
      { key: "audience", title: "Recipient or audience", description: "Choose one recipient or an audience segment.",
        fields: [
          { name: "recipient", label: "Recipient" },
          { name: "audience", label: "Audience" },
        ] },
      { key: "consent", title: "Consent & suppression", description: "Filter out suppressed recipients and honour channel preferences.",
        checklist: ["Consent verified", "Suppression list applied", "Preferred channel used where possible"] },
      { key: "render", title: "Render & preview", description: "Merge variables and preview the final message.",
        fields: [{ name: "variables", label: "Variables", type: "textarea" }] },
      { key: "send", title: "Queue & send", description: "Dispatch via the provider for the chosen channel.",
        events: ["NotificationQueued", "NotificationSent"] },
      { key: "deliver", title: "Delivery receipt", description: "Provider webhook updates the status.",
        events: ["NotificationDelivered", "NotificationFailed"] },
      { key: "retry", title: "Retry on failure", description: "Transient failures retry; hard bounces suppress the recipient.",
        rules: ["Retry with exponential backoff", "Hard bounce → suppress"] },
      { key: "audit", title: "Audit & metrics", description: "Every hop is audited and rolled up in the dashboard.",
        events: ["NotificationDelivered"] },
    ],
  },
};

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
