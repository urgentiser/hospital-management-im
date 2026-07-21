import { createFileRoute } from "@tanstack/react-router";
import {
  RotateCcw, Send, ClipboardCheck, Search, XCircle, Coins,
  ShieldCheck, AlertTriangle,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "reimbursements",
  eyebrow: "Revenue · Reimbursements",
  title: "Reimbursements",
  description: "Patient refunds, over-payment returns and duplicate-payment reversals — captured, approved, paid and audit-logged.",
  heroHeadline: "Every rand out, on the same rails as every rand in.",
  heroBlurb: "Raise refunds for over-collections or duplicate payments, get treasury approval and issue payment with a full audit trail.",
  heroBadge: "Live · Refund desk",
  heroCtas: [
    { label: "Raise a refund", sectionKey: "raise", primary: true },
    { label: "Approve queue", sectionKey: "approve" },
    { label: "Reconcile payouts", sectionKey: "reconcile" },
  ],
  overviewKpis: (items) => [
    { label: "Pending", value: items.filter((i) => i.status === "pending").length, icon: RotateCcw, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Approved", value: items.filter((i) => i.status === "approved").length, icon: ShieldCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Paid", value: items.filter((i) => i.status === "paid").length, icon: Coins, accent: "from-primary/30 to-transparent" },
    { label: "Rejected", value: items.filter((i) => i.status === "rejected").length, icon: XCircle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "raise",
      title: "Raise Refund",
      tagline: "Capture · reason · amount",
      description: "Raise a refund against a patient account or supplier payment.",
      icon: RotateCcw,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "raise", label: "Raise Refund", icon: RotateCcw, hint: "Create a refund request", kind: "Refund", startStatus: "pending",
          fields: [
            { name: "patient", label: "Patient / party", required: true },
            { name: "reason", label: "Reason", required: true, placeholder: "Over-collected / duplicate payment / correction" },
            { name: "amount", label: "Amount (R)", type: "number", required: true },
            { name: "sourceRef", label: "Source reference", placeholder: "Claim / receipt / payment ref" },
          ]},
      ],
    },
    {
      key: "approve",
      title: "Approval Queue",
      tagline: "Review · approve · reject",
      description: "Treasury reviews refund requests and approves or rejects with reason.",
      icon: ClipboardCheck,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "approve", label: "Approve Refund", icon: ShieldCheck, hint: "Approve for payment", kind: "Approve", startStatus: "approved",
          fields: [
            { name: "reference", label: "Refund ref", required: true },
            { name: "approver", label: "Approver", required: true },
          ]},
        { key: "reject", label: "Reject", icon: XCircle, hint: "Reject with reason", kind: "Reject", startStatus: "rejected",
          fields: [
            { name: "reference", label: "Refund ref", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "search", label: "Search Refunds", icon: Search, hint: "Filter refund queue", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true }] },
      ],
    },
    {
      key: "reconcile",
      title: "Payment & Reconcile",
      tagline: "Payout · reconcile",
      description: "Issue payment on approved refunds and reconcile the bank statement.",
      icon: Coins,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "issue", label: "Issue Payment", icon: Send, hint: "Send to bank payment batch", kind: "Payment", startStatus: "paid",
          fields: [
            { name: "reference", label: "Refund ref", required: true },
            { name: "bankRef", label: "Bank / EFT ref" },
          ]},
        { key: "flag-fraud", label: "Flag Suspicious", icon: AlertTriangle, hint: "Flag to fraud team", kind: "Flag", startStatus: "pending",
          fields: [
            { name: "reference", label: "Refund ref", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("reimbursements", "Reimbursements"),

  businessFlow: {
    moduleKey: "reimbursements",
    title: "Refund / Reimbursement",
    purpose: "Return money owed back to a patient or party with clear reason, treasury approval and reconciled payment.",
    legacySource: "Rich/Finance/Reimbursement.Implet; finance.reimbursement.menu.xml",
    routeFamily: ["/reimbursements", "/reimbursements/new", "/reimbursements/{id}", "/reimbursements/{id}/pay"],
    patientRequired: true,
    completionKind: "Refund",
    completionStatus: "pending",
    completionLabel: "Refund request",
    titleFrom: (v) => `Refund · ${v.patient ?? "Party"}`,
    subtitleFrom: (v) => [v.reason, v.amount && `R ${v.amount}`].filter(Boolean).join(" · "),
    events: [
      "RefundRaised", "RefundReviewed", "RefundApproved",
      "RefundRejected", "RefundPaid", "RefundReconciled",
    ],
    handoffs: ["Accounting", "Account Enquiries", "Billing", "Audit Trail"],
    globalRules: [
      "Refunds require a source reference (claim, receipt or payment).",
      "Approver may not be the raiser (segregation of duties).",
      "Amount cannot exceed available balance on the source.",
      "Bank details are verified via account-holder callback before first payout.",
      "Every event is publish to service bus and written to audit trail.",
    ],
    acceptance: [
      "Raise a refund with a matched source reference and see it pending.",
      "Approver approves the refund and it moves to payment batch.",
      "Payment is issued, bank ref recorded, reconciliation matches.",
    ],
    steps: [
      { key: "source", title: "Identify source", description: "Find the original claim, receipt or payment to refund against.",
        fields: [
          { name: "sourceType", label: "Source type", type: "select", required: true, options: ["Claim / Bill", "Receipt", "Supplier payment", "Manual"] },
          { name: "sourceRef", label: "Source reference", required: true, placeholder: "CLM- / RCT- / PAY-" },
        ],
        rules: ["Refund cannot exceed source amount minus prior refunds."] },
      { key: "party", title: "Party & bank details", description: "Confirm the party to be refunded and their bank details.",
        fields: [
          { name: "patient", label: "Party (patient / member / supplier)", required: true },
          { name: "bankName", label: "Bank" },
          { name: "accountNo", label: "Account number" },
          { name: "verified", label: "Bank details verified?", type: "select", options: ["Not yet", "Verified by callback", "On file (prior payout)"] },
        ] },
      { key: "reason", title: "Reason & amount", description: "Choose the refund reason and amount.",
        fields: [
          { name: "reason", label: "Reason", type: "select", required: true, options: ["Over-collection", "Duplicate payment", "Cancelled service", "Scheme back-payment received", "Correction of allocation"] },
          { name: "amount", label: "Amount (R)", type: "number", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ] },
      { key: "raise", title: "Raise refund", description: "Save the refund request. Ready for treasury review.",
        events: ["RefundRaised"] },
      { key: "review", title: "Treasury review", description: "Treasury inspects the request, matches to source and prepares to approve or reject.",
        checklist: ["Source reference matched", "Amount within source balance", "Bank details verified", "No duplicate refund found"],
        events: ["RefundReviewed"] },
      { key: "approve", title: "Approve / reject", description: "Approver signs off. Rejections require a reason.",
        fields: [
          { name: "approver", label: "Approver", required: true },
          { name: "decision", label: "Decision", type: "select", options: ["Approve", "Reject"] },
          { name: "rejectReason", label: "Reject reason (if rejected)", type: "textarea" },
        ],
        rules: ["Segregation of duties: approver ≠ raiser."],
        events: ["RefundApproved", "RefundRejected"] },
      { key: "payment", title: "Issue payment", description: "Add to bank payment batch. Bank reference captured on send.",
        fields: [
          { name: "bankRef", label: "Bank / EFT ref" },
          { name: "paidAt", label: "Paid on", placeholder: "YYYY-MM-DD" },
        ],
        events: ["RefundPaid"] },
      { key: "reconcile", title: "Reconcile", description: "Match to the outgoing bank statement line and close.",
        checklist: ["Bank line matched", "GL posted", "Party notified"],
        events: ["RefundReconciled"] },
    ],
  },
};

export const Route = createFileRoute("/_app/reimbursements")({
  head: () => ({
    meta: [
      { title: "Reimbursements — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
