import { createFileRoute } from "@tanstack/react-router";
import {
  FileText, Upload, ClipboardCheck, ShieldCheck, Coins, Search,
  XCircle, AlertTriangle,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "supplier-invoices",
  eyebrow: "Revenue · Accounts Payable",
  title: "Supplier Invoices",
  description: "Capture supplier invoices, 3-way match to purchase order and GRN, approve for payment and reconcile.",
  heroHeadline: "Every supplier rand, 3-way matched.",
  heroBlurb: "Load supplier invoices, match to PO and GRN, resolve exceptions and pay on time — with a defensible AP audit trail.",
  heroBadge: "Live · AP desk",
  heroCtas: [
    { label: "Capture invoice", sectionKey: "capture", primary: true },
    { label: "Approval queue", sectionKey: "approve" },
    { label: "Pay & reconcile", sectionKey: "pay" },
  ],
  overviewKpis: (items) => [
    { label: "Pending", value: items.filter((i) => i.status === "pending").length, icon: FileText, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Approved", value: items.filter((i) => i.status === "approved").length, icon: ShieldCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Paid", value: items.filter((i) => i.status === "paid").length, icon: Coins, accent: "from-primary/30 to-transparent" },
    { label: "Disputed", value: items.filter((i) => i.status === "disputed").length, icon: AlertTriangle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "capture",
      title: "Invoice Capture",
      tagline: "Load · match",
      description: "Capture supplier invoices via upload, OCR or EDI. Match to PO and GRN.",
      icon: Upload,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "capture-invoice", label: "Capture Invoice", icon: FileText, hint: "Load a supplier invoice", kind: "Invoice", startStatus: "pending",
          fields: [
            { name: "supplier", label: "Supplier", required: true },
            { name: "invoiceNo", label: "Invoice number", required: true },
            { name: "poNo", label: "PO number", required: true },
            { name: "grnNo", label: "GRN number" },
            { name: "amount", label: "Amount (R)", type: "number", required: true },
            { name: "vat", label: "VAT (R)", type: "number" },
            { name: "invoiceDate", label: "Invoice date", placeholder: "YYYY-MM-DD" },
          ]},
        { key: "three-way-match", label: "3-Way Match", icon: ClipboardCheck, hint: "Match invoice · PO · GRN", kind: "3-Way", startStatus: "pending",
          fields: [{ name: "invoiceNo", label: "Invoice number", required: true }] },
      ],
    },
    {
      key: "approve",
      title: "Approval Queue",
      tagline: "Review · approve · dispute",
      description: "Managers approve matched invoices; dispute mismatches with the supplier.",
      icon: ShieldCheck,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "approve-invoice", label: "Approve Invoice", icon: ShieldCheck, hint: "Approve for payment", kind: "Approve", startStatus: "approved",
          fields: [
            { name: "invoiceNo", label: "Invoice number", required: true },
            { name: "approver", label: "Approver", required: true },
          ]},
        { key: "dispute", label: "Dispute Invoice", icon: AlertTriangle, hint: "Return to supplier", kind: "Dispute", startStatus: "disputed",
          fields: [
            { name: "invoiceNo", label: "Invoice number", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "search", label: "Search Invoices", icon: Search, hint: "Filter AP queue", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true }] },
      ],
    },
    {
      key: "pay",
      title: "Payment & Reconcile",
      tagline: "Pay run · match bank",
      description: "Run supplier payment batches and reconcile to bank statement.",
      icon: Coins,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "pay-run", label: "Run Payment Batch", icon: Coins, hint: "Generate the AP pay run", kind: "Pay Run", startStatus: "paid",
          fields: [
            { name: "period", label: "Period", required: true, placeholder: "YYYY-MM" },
            { name: "amount", label: "Batch total (R)", type: "number" },
          ]},
        { key: "reconcile", label: "Reconcile", icon: ClipboardCheck, hint: "Match to bank statement", kind: "Reconcile", startStatus: "paid",
          fields: [{ name: "period", label: "Period", required: true }] },
        { key: "reject-pay", label: "Reject from Pay Run", icon: XCircle, hint: "Hold from this pay run", kind: "Hold", startStatus: "pending",
          fields: [
            { name: "invoiceNo", label: "Invoice number", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("supplier-invoices", "Supplier Invoices"),

  businessFlow: {
    moduleKey: "supplier-invoices",
    title: "Supplier Invoice",
    purpose: "Turn a supplier invoice into a paid, reconciled AP transaction — 3-way matched, approved and posted.",
    legacySource: "Rich/Finance/AP.Implet; ap.invoice.menu.xml",
    routeFamily: ["/supplier-invoices", "/supplier-invoices/new", "/supplier-invoices/{id}", "/supplier-invoices/{id}/pay"],
    completionKind: "Invoice",
    completionStatus: "pending",
    completionLabel: "Invoice captured",
    titleFrom: (v) => `${v.supplier ?? "Supplier"} · ${v.invoiceNo ?? ""}`.trim(),
    subtitleFrom: (v) => [v.poNo, v.amount && `R ${v.amount}`].filter(Boolean).join(" · "),
    events: [
      "InvoiceCaptured", "InvoiceMatched", "InvoiceApproved",
      "InvoiceDisputed", "InvoicePaid", "InvoiceReconciled",
    ],
    handoffs: ["Accounting", "Procurement", "Audit Trail"],
    globalRules: [
      "Every invoice must reference a valid PO.",
      "GRN required for goods; service invoices require service confirmation.",
      "Approval limits enforced by role and cost centre.",
      "Invoices held for dispute are excluded from pay runs.",
      "VAT is validated against supplier VAT registration status.",
    ],
    acceptance: [
      "Capture an invoice, 3-way match and approve within limit.",
      "Dispute a price mismatch and see it excluded from the next pay run.",
      "Pay an approved invoice and reconcile to the bank line.",
    ],
    steps: [
      { key: "capture", title: "Capture invoice", description: "Capture header — supplier, invoice number, date and total.",
        fields: [
          { name: "supplier", label: "Supplier", required: true },
          { name: "invoiceNo", label: "Invoice number", required: true },
          { name: "invoiceDate", label: "Invoice date", required: true, placeholder: "YYYY-MM-DD" },
          { name: "amount", label: "Total inc. VAT (R)", type: "number", required: true },
          { name: "vat", label: "VAT (R)", type: "number" },
        ],
        events: ["InvoiceCaptured"] },
      { key: "po", title: "PO reference", description: "Reference the purchase order this invoice belongs to.",
        fields: [
          { name: "poNo", label: "PO number", required: true },
          { name: "costCentre", label: "Cost centre" },
        ],
        rules: ["Invoice without a PO is blocked unless emergency PO is created."] },
      { key: "grn", title: "GRN / service confirmation", description: "Reference the GRN for goods or the service confirmation for services.",
        fields: [
          { name: "grnNo", label: "GRN number" },
          { name: "serviceConf", label: "Service confirmation ref" },
        ] },
      { key: "match", title: "3-way match", description: "The system compares invoice · PO · GRN. Tolerances apply for price and quantity.",
        checklist: ["Price within tolerance", "Quantity within tolerance", "Currency matches", "Tax code correct"],
        events: ["InvoiceMatched"] },
      { key: "coding", title: "GL coding", description: "Confirm GL account and cost centre allocation.",
        fields: [
          { name: "glAccount", label: "GL account", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ] },
      { key: "approve", title: "Approve within limit", description: "Approver signs off within their limit. Escalate if over-limit.",
        fields: [
          { name: "approver", label: "Approver", required: true },
          { name: "decision", label: "Decision", type: "select", options: ["Approve", "Escalate", "Dispute"] },
        ],
        events: ["InvoiceApproved", "InvoiceDisputed"] },
      { key: "payrun", title: "Include in pay run", description: "Approved invoices flow into the next AP pay run based on due date.",
        fields: [
          { name: "dueDate", label: "Due date", placeholder: "YYYY-MM-DD" },
          { name: "payMethod", label: "Method", type: "select", options: ["EFT", "Bank transfer", "Cheque", "Card"] },
        ] },
      { key: "pay", title: "Payment issued", description: "Payment is issued and bank reference captured.",
        fields: [
          { name: "bankRef", label: "Bank / EFT ref" },
          { name: "paidAt", label: "Paid on", placeholder: "YYYY-MM-DD" },
        ],
        events: ["InvoicePaid"] },
      { key: "reconcile", title: "Reconcile to bank", description: "Match to the outgoing bank statement line.",
        events: ["InvoiceReconciled"] },
      { key: "publish", title: "Publish & audit", description: "Publish InvoicePaid to service bus and write the audit record.",
        events: ["InvoicePaid"] },
    ],
  },
};

export const Route = createFileRoute("/_app/supplier-invoices")({
  head: () => ({
    meta: [
      { title: "Supplier Invoices — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
