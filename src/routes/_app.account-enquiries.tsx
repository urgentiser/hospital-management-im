import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare, PhoneCall, Search, ClipboardCheck, XCircle, ShieldCheck,
  ArrowUpCircle, FileText,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "account-enquiries",
  eyebrow: "Revenue · Accounts",
  title: "Account Enquiries",
  description: "Patient and payer account queries — statement disputes, refund status, unallocated payments and balance questions.",
  heroHeadline: "Every account question, tracked and closed.",
  heroBlurb: "Log queries from call, portal or email, work the queue against a live account view, resolve or escalate — all against SLA.",
  heroBadge: "Live · Accounts desk",
  heroCtas: [
    { label: "Log an enquiry", sectionKey: "capture", primary: true },
    { label: "Open queue", sectionKey: "board" },
    { label: "Escalate to finance", sectionKey: "escalate" },
  ],
  overviewKpis: (items) => [
    { label: "Open", value: items.filter((i) => i.status === "open").length, icon: MessageSquare, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "In progress", value: items.filter((i) => i.status === "in-progress").length, icon: ClipboardCheck, accent: "from-primary/30 to-transparent" },
    { label: "Resolved", value: items.filter((i) => i.status === "resolved").length, icon: ShieldCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Escalated", value: items.filter((i) => i.status === "escalated").length, icon: ArrowUpCircle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "capture",
      title: "Capture Enquiry",
      tagline: "Call · portal · email",
      description: "Log an enquiry from any channel with the linked account and context.",
      icon: PhoneCall,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "log", label: "Log Enquiry", icon: MessageSquare, hint: "Capture an incoming account query", kind: "Enquiry", startStatus: "open",
          fields: [
            { name: "patient", label: "Patient / party", required: true },
            { name: "channel", label: "Channel", required: true, placeholder: "Call / Portal / Email / Walk-in" },
            { name: "topic", label: "Topic", required: true, placeholder: "Statement / Refund / Balance / Allocation" },
            { name: "amount", label: "Amount in dispute (R)", type: "number" },
            { name: "notes", label: "Notes", type: "textarea", required: true },
          ]},
      ],
    },
    {
      key: "board",
      title: "Enquiry Board",
      tagline: "Assign · resolve",
      description: "Work the queue against a live account view. Assign, respond, resolve or close.",
      icon: ClipboardCheck,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "assign", label: "Assign", icon: ClipboardCheck, hint: "Assign owner", kind: "Assign", startStatus: "in-progress",
          fields: [
            { name: "reference", label: "Enquiry ref", required: true },
            { name: "owner", label: "Owner", required: true },
          ]},
        { key: "respond", label: "Send Response", icon: FileText, hint: "Reply to the party", kind: "Respond", startStatus: "in-progress",
          fields: [
            { name: "reference", label: "Enquiry ref", required: true },
            { name: "response", label: "Response", required: true, type: "textarea" },
          ]},
        { key: "resolve", label: "Resolve", icon: ShieldCheck, hint: "Close as resolved", kind: "Resolve", startStatus: "resolved",
          fields: [
            { name: "reference", label: "Enquiry ref", required: true },
            { name: "resolution", label: "Resolution", required: true, type: "textarea" },
          ]},
        { key: "search", label: "Search Enquiries", icon: Search, hint: "Filter the queue", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true }] },
      ],
    },
    {
      key: "escalate",
      title: "Escalation",
      tagline: "Finance · reject",
      description: "Escalate stuck enquiries to Finance or reject invalid queries.",
      icon: ArrowUpCircle,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "escalate", label: "Escalate to Finance", icon: ArrowUpCircle, hint: "Escalate beyond the desk", kind: "Escalate", startStatus: "escalated",
          fields: [
            { name: "reference", label: "Enquiry ref", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "reject", label: "Reject Enquiry", icon: XCircle, hint: "Invalid or duplicate query", kind: "Reject", startStatus: "resolved",
          fields: [
            { name: "reference", label: "Enquiry ref", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("account-enquiries", "Account Enquiries"),

  businessFlow: {
    moduleKey: "account-enquiries",
    title: "Account Enquiry",
    purpose: "Log, work and resolve a party's account enquiry against a live view of their statement — with SLA, ownership and audit.",
    legacySource: "Rich/Finance/AccountEnquiry.Implet; finance.enquiry.menu.xml",
    routeFamily: ["/account-enquiries", "/account-enquiries/new", "/account-enquiries/{id}", "/account-enquiries/{id}/timeline"],
    patientRequired: true,
    completionKind: "Enquiry",
    completionStatus: "open",
    completionLabel: "Enquiry logged",
    titleFrom: (v) => `${v.topic ?? "Enquiry"} · ${v.patient ?? "Party"}`,
    subtitleFrom: (v) => [v.channel, v.amount && `R ${v.amount}`].filter(Boolean).join(" · "),
    events: [
      "EnquiryLogged", "EnquiryAssigned", "EnquiryResponseSent",
      "EnquiryResolved", "EnquiryEscalated",
    ],
    handoffs: ["Billing", "Reimbursements", "Accounting", "Case Management"],
    globalRules: [
      "Every enquiry has an SLA based on channel and topic.",
      "Ownership is enforced — a party sees a single point of contact.",
      "Responses to the party are logged as customer-facing communications.",
      "Financial changes flow to Billing or Reimbursements — never edited here directly.",
      "All actions publish to audit trail and service bus.",
    ],
    acceptance: [
      "Log an enquiry from a call, assign owner and respond within SLA.",
      "Resolve an enquiry that requires a refund by handoff to Reimbursements.",
      "Escalate a stuck enquiry to Finance with reason.",
    ],
    steps: [
      { key: "party", title: "Identify party & account", description: "Confirm the party (patient/member/guarantor) and open their account view.",
        fields: [
          { name: "patient", label: "Party", required: true },
          { name: "accountRef", label: "Account reference" },
          { name: "channel", label: "Channel", type: "select", required: true, options: ["Call", "Portal", "Email", "Walk-in", "WhatsApp"] },
        ] },
      { key: "topic", title: "Enquiry topic", description: "Categorise the enquiry so the right owner and SLA apply.",
        fields: [
          { name: "topic", label: "Topic", type: "select", required: true, options: ["Statement dispute", "Refund status", "Balance question", "Unallocated payment", "Scheme allocation", "Invoice detail", "Other"] },
          { name: "amount", label: "Amount in dispute (R)", type: "number" },
        ] },
      { key: "detail", title: "Capture detail", description: "Capture the party's own words and any references they mention.",
        fields: [
          { name: "notes", label: "Detail", required: true, type: "textarea" },
          { name: "refs", label: "References cited", placeholder: "Claim / receipt / statement date" },
        ],
        events: ["EnquiryLogged"] },
      { key: "sla", title: "Set SLA & owner", description: "SLA is derived from topic and channel; owner is auto-assigned from the roster.",
        fields: [
          { name: "sla", label: "SLA (business hours)", type: "number", placeholder: "e.g. 24" },
          { name: "owner", label: "Owner", required: true },
        ],
        events: ["EnquiryAssigned"] },
      { key: "investigate", title: "Investigate", description: "Investigate against the live account: statement, allocations, claims and refunds.",
        checklist: ["Statement reviewed", "Allocations checked", "Related claims / refunds inspected", "Interaction history reviewed"] },
      { key: "action", title: "Take corrective action", description: "If action is needed, hand off — never edit financials here directly.",
        fields: [
          { name: "action", label: "Action", type: "select", options: ["None (explanation only)", "Reallocate payment (Accounting)", "Raise refund (Reimbursements)", "Reissue statement (Billing)", "Adjust bill (Billing)"] },
          { name: "handoffRef", label: "Hand-off reference (if any)" },
        ] },
      { key: "respond", title: "Respond to party", description: "Send a written response to the party via their preferred channel.",
        fields: [
          { name: "response", label: "Response", required: true, type: "textarea" },
          { name: "responseChannel", label: "Response channel", type: "select", options: ["Email", "SMS", "Portal", "Call-back", "Post"] },
        ],
        events: ["EnquiryResponseSent"] },
      { key: "confirm", title: "Confirm satisfaction", description: "Confirm the party is satisfied. If not, escalate.",
        fields: [{ name: "satisfied", label: "Satisfied?", type: "select", options: ["Yes", "No — needs escalation"] }] },
      { key: "close", title: "Resolve or escalate", description: "Close as resolved or escalate to Finance.",
        fields: [
          { name: "outcome", label: "Outcome", type: "select", options: ["Resolved", "Escalated"] },
          { name: "closeNotes", label: "Closing notes", type: "textarea" },
        ],
        events: ["EnquiryResolved", "EnquiryEscalated"] },
      { key: "publish", title: "Publish & audit", description: "Publish EnquiryResolved to the service bus and archive under audit.",
        events: ["EnquiryResolved"] },
    ],
  },
};

export const Route = createFileRoute("/_app/account-enquiries")({
  head: () => ({
    meta: [
      { title: "Account Enquiries — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
