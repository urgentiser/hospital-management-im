import { createFileRoute } from "@tanstack/react-router";
import {
  Receipt, Send, FileText, RotateCcw, ClipboardCheck, Search,
  Coins, XCircle, ShieldAlert,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "billing",
  patientScoped: true,
  eyebrow: "Revenue · Billing",
  title: "Billing",
  description: "Bill preparation, claim submission, remittance handling and reconciliation for every payer.",
  heroHeadline: "Clean claims out, clean payments in.",
  heroBlurb: "Assemble bills from coded events, submit to schemes and reconcile remittances — with a full drill-down to the underlying event.",
  heroBadge: "Live · Revenue desk",
  heroCtas: [
    { label: "Prepare a bill", sectionKey: "prepare", primary: true },
    { label: "Submit claims", sectionKey: "submit" },
    { label: "Reconcile remittances", sectionKey: "reconcile" },
  ],
  overviewKpis: (items) => [
    { label: "Claims", value: items.length, icon: Receipt, accent: "from-primary/30 to-transparent" },
    { label: "Submitted", value: items.filter((i) => i.status === "submitted").length, icon: Send, accent: "from-sky-500/30 to-transparent" },
    { label: "Paid", value: items.filter((i) => i.status === "paid").length, icon: Coins, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Rejected", value: items.filter((i) => i.status === "rejected").length, icon: XCircle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "prepare",
      title: "Bill Preparation",
      tagline: "Assemble · check",
      description: "Assemble a bill from coded events, run pre-submission checks and finalise.",
      icon: FileText,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "assemble", label: "Assemble Bill", icon: FileText, hint: "Assemble bill from coded episode", kind: "Bill", startStatus: "draft",
          fields: [
            { name: "episode", label: "Episode / case", required: true },
            { name: "patient", label: "Patient", required: true },
            { name: "scheme", label: "Scheme", required: true },
            { name: "authRef", label: "Auth reference" },
            { name: "amount", label: "Total (R)", type: "number" },
          ]},
        { key: "prebill-checks", label: "Pre-bill Checks", icon: ClipboardCheck, hint: "Run edits and check missing docs", kind: "Pre-bill Checks", startStatus: "draft",
          fields: [{ name: "reference", label: "Bill ref", required: true }] },
      ],
    },
    {
      key: "submit",
      title: "Claim Submission",
      tagline: "Submit · resubmit",
      description: "Submit claims to schemes and resubmit corrected claims.",
      icon: Send,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "submit-claim", label: "Submit Claim", icon: Send, hint: "Submit to scheme via Claim XML", kind: "Submit", startStatus: "submitted",
          fields: [
            { name: "reference", label: "Bill ref", required: true },
            { name: "channel", label: "Channel", placeholder: "Claim XML / Portal / Manual" },
          ]},
        { key: "resubmit-claim", label: "Resubmit", icon: RotateCcw, hint: "Resubmit corrected claim", kind: "Resubmit", startStatus: "submitted",
          fields: [
            { name: "reference", label: "Bill ref", required: true },
            { name: "changes", label: "Changes", required: true, type: "textarea" },
          ]},
      ],
    },
    {
      key: "reconcile",
      title: "Remittance & Reconciliation",
      tagline: "Match · post",
      description: "Load remittance advices, match to claims and post payments to the ledger.",
      icon: Coins,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "load-ra", label: "Load Remittance", icon: FileText, hint: "Import remittance advice", kind: "Remittance", startStatus: "pending",
          fields: [
            { name: "scheme", label: "Scheme", required: true },
            { name: "raRef", label: "RA reference" },
            { name: "amount", label: "Total paid (R)", type: "number" },
          ]},
        { key: "reconcile", label: "Reconcile", icon: ClipboardCheck, hint: "Match RA lines to claims", kind: "Reconcile", startStatus: "paid",
          fields: [{ name: "raRef", label: "RA reference", required: true }] },
        { key: "search", label: "Search Claims", icon: Search, hint: "Filter claims", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true }] },
        { key: "flag-short", label: "Flag Short-payment", icon: ShieldAlert, hint: "Flag paid < billed", kind: "Short-payment", startStatus: "rejected",
          fields: [
            { name: "reference", label: "Claim ref", required: true },
            { name: "reason", label: "Reason", type: "textarea", required: true },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("billing", "Billing"),

  businessFlow: {
    moduleKey: "billing",
    title: "Bill-to-Payment",
    purpose: "Turn a coded episode into a paid claim: assemble bill lines, submit to the scheme, reconcile the remittance and post to the ledger.",
    legacySource: "Rich/Billing/Bill.Implet; billing.menu.xml",
    routeFamily: ["/billing", "/billing/new", "/billing/{id}", "/billing/remittances", "/billing/{id}/reconcile"],
    patientRequired: true,
    completionKind: "Claim",
    completionStatus: "submitted",
    completionLabel: "Claim submitted",
    titleFrom: (v) => `Claim · ${v.patient ?? "Patient"}`,
    subtitleFrom: (v) => [v.scheme, v.amount && `R ${v.amount}`].filter(Boolean).join(" · "),
    events: [
      "BillDrafted", "BillFinalised", "ClaimSubmitted", "RemittanceReceived",
      "PaymentAllocated", "ClaimRejected", "ClaimShortPaid",
    ],
    handoffs: ["Accounting", "Reimbursements", "Account Enquiries", "Case Management"],
    globalRules: [
      "A bill can only be assembled from a signed coded episode.",
      "Every line must map to a scheme tariff or negotiated rate.",
      "Claims cannot exceed the approved authorisation amount without a co-payment note.",
      "Remittance short-payments open an account enquiry automatically.",
      "Every action is automatically audited.",
    ],
    acceptance: [
      "Assemble a bill from a coded episode and see totals match tariff.",
      "Submit a claim and record the scheme acknowledgement.",
      "Reconcile a remittance with partial short-payment; enquiry auto-opens.",
    ],
    steps: [
      { key: "episode", title: "Select signed episode", description: "Pick an episode that has been coded and signed.",
        fields: [
          { name: "episode", label: "Episode / case ref", required: true },
          { name: "patient", label: "Patient", required: true },
          { name: "scheme", label: "Scheme", required: true },
          { name: "authRef", label: "Authorisation ref" },
        ],
        rules: ["Coding must be signed before billing."] },
      { key: "lines", title: "Assemble bill lines", description: "Generate lines from coded events. Split hospital / professional / consumables.",
        fields: [
          { name: "hospitalAmount", label: "Hospital (R)", type: "number" },
          { name: "professionalAmount", label: "Professional (R)", type: "number" },
          { name: "consumables", label: "Consumables (R)", type: "number" },
          { name: "amount", label: "Total (R)", type: "number", required: true },
        ] },
      { key: "tariff", title: "Apply tariff & rules", description: "Apply scheme tariff, negotiated overrides, PMB pricing and any co-payment.",
        checklist: ["Scheme tariff applied per line", "Negotiated overrides applied", "PMB pricing where applicable", "Co-payment computed"] },
      { key: "checks", title: "Pre-submission edits", description: "Run scheme edits — code combos, sequencing, unbundling and duplicates.",
        checklist: ["No unbundling warnings", "No duplicate lines", "Code sequencing valid", "Modifier fields captured"] },
      { key: "finalise", title: "Finalise bill", description: "Finalise the bill. It becomes immutable and ready to submit.",
        fields: [{ name: "finaliseNote", label: "Finalise note", type: "textarea" }],
        events: ["BillDrafted", "BillFinalised"] },
      { key: "submit", title: "Submit claim", description: "Submit to the scheme via Claim XML, portal or manual channel.",
        fields: [{ name: "channel", label: "Submission channel", type: "select", options: ["Claim XML", "Scheme portal", "Manual", "EDI"] }],
        events: ["ClaimSubmitted"] },
      { key: "ack", title: "Scheme acknowledgement", description: "Record the scheme acknowledgement and tracking reference.",
        fields: [
          { name: "schemeRef", label: "Scheme claim ref" },
          { name: "ackDate", label: "Ack date", placeholder: "YYYY-MM-DD" },
        ] },
      { key: "remittance", title: "Remittance received", description: "Load the remittance advice and match to the claim.",
        fields: [
          { name: "raRef", label: "RA reference" },
          { name: "paidAmount", label: "Paid amount (R)", type: "number" },
        ],
        events: ["RemittanceReceived"] },
      { key: "reconcile", title: "Reconcile & allocate", description: "Match RA lines to claim lines. Any short-payment opens an enquiry.",
        checklist: ["Every line matched or explicitly written off", "Short-payment reasons captured", "Enquiry opened for disputes"],
        events: ["PaymentAllocated", "ClaimShortPaid"] },
      { key: "post", title: "Post to ledger", description: "Post the payment to the GL and close the claim.",
        events: ["PaymentAllocated"] },
    ],
  },
};

export const Route = createFileRoute("/_app/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
