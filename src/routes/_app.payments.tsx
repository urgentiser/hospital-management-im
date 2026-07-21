import { createFileRoute } from "@tanstack/react-router";
import {
  Banknote, HandCoins, RotateCcw, Printer, Wallet, CheckCircle2, Layers, Coins, ClipboardList,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "payments",
  eyebrow: "Financial · Payments",
  title: "Payments",
  description: "Capture, allocate, refund, reverse and reconcile patient and scheme payments.",
  heroHeadline: "Every payment captured, allocated and reconciled.",
  heroBlurb: "Take patient and scheme payments, allocate them to invoices, issue refunds and reconcile settlements — with a full audit trail.",
  heroBadge: "Live · Payments desk",
  heroCtas: [
    { label: "Capture a payment", sectionKey: "capture", primary: true },
    { label: "Allocate a payment", sectionKey: "capture" },
    { label: "Refund a payment", sectionKey: "adjustments" },
  ],
  overviewKpis: (items) => {
    const total = items.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
    return [
      { label: "Payments", value: items.length, icon: Layers, accent: "from-primary/30 to-transparent" },
      { label: "Allocated", value: items.filter((i) => i.status === "allocated" || i.status === "reconciled").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Pending", value: items.filter((i) => i.status === "captured" || i.status === "pending").length, icon: Wallet, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Value captured", value: fmtR(total), icon: Coins, accent: "from-sky-500/30 to-transparent" },
    ];
  },
  sections: [
    {
      key: "capture",
      title: "Capture & Allocate",
      tagline: "Receive · allocate · receipt",
      description: "Capture patient and scheme payments and allocate them to open invoices.",
      icon: Banknote,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "capture", label: "Capture Payment", icon: Banknote, hint: "Cash, card or EFT", kind: "Payment", startStatus: "captured",
          fields: [
            { name: "payer", label: "Payer", required: true },
            { name: "method", label: "Method", required: true, placeholder: "Cash / Card / EFT / Scheme remittance" },
            { name: "amount", label: "Amount (R)", type: "number", required: true },
            { name: "reference", label: "Reference" },
          ]},
        { key: "allocate", label: "Allocate Payment", icon: ClipboardList, hint: "Allocate to invoice(s)", kind: "Allocation", startStatus: "allocated",
          fields: [
            { name: "payment", label: "Payment ID", required: true },
            { name: "invoice", label: "Invoice", required: true },
            { name: "amount", label: "Allocated (R)", type: "number", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "print-receipt", label: "Print Receipt", icon: Printer, hint: "Print or re-print a receipt", kind: "Receipt Print", startStatus: "captured",
          fields: [
            { name: "payment", label: "Payment ID", required: true },
            { name: "printer", label: "Printer" },
          ]},
      ],
    },
    {
      key: "adjustments",
      title: "Refunds & Reversals",
      tagline: "Refund · reverse",
      description: "Issue refunds and reverse payments where authorised.",
      icon: RotateCcw,
      accent: "from-rose-500/25 via-orange-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "refund", label: "Refund Payment", icon: HandCoins, hint: "Refund back to payer", kind: "Refund", startStatus: "pending", destructive: true,
          fields: [
            { name: "payment", label: "Original payment", required: true },
            { name: "amount", label: "Refund amount (R)", type: "number", required: true },
            { name: "method", label: "Method" },
            { name: "reason", label: "Reason", required: true },
          ]},
        { key: "reverse", label: "Reverse Payment", icon: RotateCcw, hint: "Reverse a captured payment", kind: "Reversal", startStatus: "pending", destructive: true,
          fields: [
            { name: "payment", label: "Payment ID", required: true },
            { name: "reason", label: "Reason", required: true },
          ]},
      ],
    },
    {
      key: "reconciliation",
      title: "Reconciliation",
      tagline: "Match · confirm",
      description: "Reconcile captured payments against bank and scheme settlements.",
      icon: CheckCircle2,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "reconcile", label: "Reconcile Payment", icon: CheckCircle2, hint: "Match to settlement", kind: "Reconciliation", startStatus: "reconciled",
          fields: [
            { name: "payment", label: "Payment ID", required: true },
            { name: "settlement", label: "Settlement reference", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "payments",
    title: "Capture Payment",
    purpose: "Capture a payment, allocate it and issue a receipt.",
    globalRules: [],
    events: [],
    acceptance: [],
    completionKind: "Payment",
    completionStatus: "allocated",
    completionLabel: "Payment allocated",
    titleFrom: (v) => `${v.payer ?? "Payer"} · ${v.method ?? "Payment"}`,
    subtitleFrom: (v) => [v.amount && `R ${v.amount}`, v.reference].filter(Boolean).join(" · "),
    steps: [
      { key: "payer", title: "Payer", description: "Identify the payer and the payment context.",
        fields: [
          { name: "payer", label: "Payer", required: true },
          { name: "patient", label: "Patient / account" },
        ]},
      { key: "amount", title: "Amount & method", description: "Capture the amount and payment method.",
        fields: [
          { name: "amount", label: "Amount (R)", type: "number", required: true },
          { name: "method", label: "Method", type: "select", required: true, options: ["Cash", "Card", "EFT", "Scheme remittance"] },
          { name: "reference", label: "Reference" },
        ]},
      { key: "allocate", title: "Allocate", description: "Allocate the payment to one or more open invoices.",
        fields: [
          { name: "invoice", label: "Invoice(s)" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]},
      { key: "review", title: "Review", description: "Confirm the details before capturing the payment." },
      { key: "outcome", title: "Completed", description: "Payment captured and available for reconciliation." },
    ],
  },
};

export const Route = createFileRoute("/_app/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});

function parseCurrency(s: string) {
  const n = parseFloat(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function fmtR(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
