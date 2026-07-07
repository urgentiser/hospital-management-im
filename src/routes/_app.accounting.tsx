import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen, Banknote, Receipt, HandCoins, RotateCcw, Wallet, Layers,
  FileDown, Lock, CheckCircle2, ClipboardList, Coins, Landmark,
  ShieldCheck, FileCog, Building2, Sparkles,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "accounting",
  eyebrow: "Financial · Accounting",
  title: "Accounting",
  description: "Receipting, refunds, suspense management and month-end close — the finance backbone of Impilo.",
  heroHeadline: "Every rand tracked, every journal reconciled, every period closed with confidence.",
  heroBlurb: "Capture receipts, resolve zero-payments, manage refunds and suspense, and drive the general ledger through month-end close.",
  heroBadge: "Live · General ledger",
  heroCtas: [
    { label: "Capture a receipt", sectionKey: "receipting", primary: true },
    { label: "Post pending journals", sectionKey: "ledger" },
    { label: "Handle a refund", sectionKey: "adjustments" },
  ],
  overviewKpis: (items) => {
    const posted = items.filter((i) => i.status === "posted" || i.status === "closed");
    const net = posted.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
    return [
      { label: "All entries", value: items.length, icon: Layers, accent: "from-primary/30 to-transparent" },
      { label: "Posted", value: posted.length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Pending review", value: items.filter((i) => i.status === "pending" || i.status === "captured").length, icon: FileCog, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Net posted", value: fmtR(net), icon: Coins, accent: "from-sky-500/30 to-transparent", hint: "Sum of posted & closed" },
    ];
  },
  sectionKpis: (section, items) => {
    const scoped = items.filter((i) => section.actions.map((a) => a.kind).includes(String(i.fields["Kind"] ?? "")));
    const value = scoped.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
    if (section.key === "receipting") {
      return [
        { label: "Receipts", value: scoped.length, icon: Receipt, accent: "from-primary/30 to-transparent" },
        { label: "Posted", value: scoped.filter((i) => i.status === "posted" || i.status === "closed").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Captured value", value: fmtR(value), icon: Coins, accent: "from-sky-500/30 to-transparent" },
      ];
    }
    if (section.key === "adjustments") {
      return [
        { label: "Adjustments", value: scoped.length, icon: RotateCcw, accent: "from-primary/30 to-transparent" },
        { label: "Refunds paid", value: scoped.filter((i) => i.fields["Kind"] === "Refund" && (i.status === "posted" || i.status === "closed")).length, icon: HandCoins, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Reversals", value: scoped.filter((i) => i.fields["Kind"] === "Reversal").length, icon: RotateCcw, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      ];
    }
    if (section.key === "suspense") {
      return [
        { label: "Suspense items", value: scoped.length, icon: Wallet, accent: "from-primary/30 to-transparent" },
        { label: "Unresolved", value: scoped.filter((i) => i.status !== "posted" && i.status !== "closed").length, icon: FileCog, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Held value", value: fmtR(value), icon: Coins, accent: "from-sky-500/30 to-transparent" },
      ];
    }
    if (section.key === "ledger") {
      return [
        { label: "Journals", value: scoped.filter((i) => i.fields["Kind"] === "Journal").length, icon: BookOpen, accent: "from-primary/30 to-transparent" },
        { label: "Closed periods", value: scoped.filter((i) => i.fields["Kind"] === "Period Close").length, icon: Lock, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Exports", value: scoped.filter((i) => i.fields["Kind"] === "Trial Balance").length, icon: FileDown, accent: "from-sky-500/30 to-transparent" },
      ];
    }
    return [];
  },
  sections: [
    {
      key: "receipting",
      title: "Receipting",
      tagline: "Receipts · payments · zero-payments",
      description: "Capture cash, card and EFT receipts, handle zero-payment remittances and specialist EU Dr & Renal receipting.",
      icon: Receipt,
      accent: "from-primary/25 via-indigo-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "receipting", label: "Receipting", icon: Receipt, hint: "Standard patient / scheme receipt", kind: "Receipt", startStatus: "captured",
          fields: [
            { name: "patient", label: "Patient / Payer", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "method", label: "Method", placeholder: "Cash / Card / EFT" },
            { name: "reference", label: "Reference" },
          ]},
        { key: "payment-receipting", label: "Payment Receipting", icon: Banknote, hint: "Allocate a payment to an invoice", kind: "Payment Receipt", startStatus: "captured",
          fields: [
            { name: "invoice", label: "Invoice", required: true },
            { name: "payer", label: "Payer" },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "date", label: "Value date", placeholder: "YYYY-MM-DD" },
          ]},
        { key: "capture-zero-payments", label: "Capture Zero Payments", icon: ClipboardList, hint: "Log a nil remittance line", kind: "Zero Payment", startStatus: "captured",
          fields: [
            { name: "claim", label: "Claim reference", required: true },
            { name: "scheme", label: "Scheme" },
            { name: "reason", label: "Reason" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "bulk-zero-payment", label: "Bulk Zero Payment", icon: Layers, hint: "Process a nil remittance batch", kind: "Bulk Zero Payment", startStatus: "pending",
          fields: [
            { name: "batch", label: "Batch reference", required: true },
            { name: "scheme", label: "Scheme" },
            { name: "count", label: "Claim count", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "eu-dr-renal", label: "EU Dr & Renal Receipts", icon: HandCoins, hint: "Specialist EU Dr / Renal receipting", kind: "EU/Renal Receipt", startStatus: "captured",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "programme", label: "Programme", placeholder: "EU Dr / Renal" },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "reference", label: "Reference" },
          ]},
      ],
    },
    {
      key: "adjustments",
      title: "Refunds & Reversals",
      tagline: "Refunds · reversals · corrections",
      description: "Refund patients, reverse receipts and correct misallocations with a full audit trail.",
      icon: RotateCcw,
      accent: "from-rose-500/25 via-orange-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "refund-patient", label: "Refund Patient", icon: HandCoins, hint: "Issue a refund to a patient", kind: "Refund", startStatus: "pending", destructive: true,
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "method", label: "Method", placeholder: "EFT / Cash / Reversal" },
            { name: "reason", label: "Reason", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "reversal-of-receipts", label: "Reversal of Receipts", icon: RotateCcw, hint: "Reverse a captured receipt", kind: "Reversal", startStatus: "pending", destructive: true,
          fields: [
            { name: "receipt", label: "Receipt ID", required: true },
            { name: "amount", label: "Amount", placeholder: "R 0.00" },
            { name: "reason", label: "Reason", required: true },
          ]},
      ],
    },
    {
      key: "suspense",
      title: "Suspense",
      tagline: "Unallocated · holding accounts",
      description: "Park unidentified receipts in suspense and resolve them once the payer is confirmed.",
      icon: Wallet,
      accent: "from-amber-500/25 via-yellow-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "suspense-account", label: "Suspense Account", icon: Wallet, hint: "Move a receipt to suspense", kind: "Suspense", startStatus: "captured",
          fields: [
            { name: "reference", label: "Receipt / Ref", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "reason", label: "Reason" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "resolve-suspense", label: "Resolve Suspense", icon: CheckCircle2, hint: "Allocate suspense to a payer", kind: "Suspense Resolution", startStatus: "pending",
          fields: [
            { name: "reference", label: "Suspense reference", required: true },
            { name: "payer", label: "Allocate to payer" },
            { name: "amount", label: "Amount", placeholder: "R 0.00" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "ledger",
      title: "General Ledger",
      tagline: "Journals · trial balance · period close",
      description: "Post GL journals, export a trial balance and lock a period once month-end is signed off.",
      icon: BookOpen,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "post-journal", label: "Post Journal", icon: BookOpen, hint: "Draft or post a GL journal", kind: "Journal", startStatus: "draft",
          fields: [
            { name: "description", label: "Description", required: true },
            { name: "account", label: "GL account", required: true, placeholder: "e.g. 4000 Revenue" },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "period", label: "Period", required: true, placeholder: "e.g. June 2026" },
            { name: "journal", label: "Journal ref", placeholder: "JV-0000" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "trial-balance", label: "Trial Balance", icon: FileDown, hint: "Export a trial balance", kind: "Trial Balance", startStatus: "posted",
          fields: [
            { name: "period", label: "Period", required: true, placeholder: "e.g. June 2026" },
            { name: "scope", label: "Scope", placeholder: "Facility / consolidated" },
          ]},
        { key: "close-period", label: "Close Period", icon: Lock, hint: "Lock a period for month-end", kind: "Period Close", startStatus: "pending", destructive: true,
          fields: [
            { name: "period", label: "Period", required: true, placeholder: "e.g. June 2026" },
            { name: "signOff", label: "Signed off by" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "controls",
      title: "Controls & Compliance",
      tagline: "Reconciliations · sign-off · audit",
      description: "Bank reconciliations, sign-off registers and audit-ready evidence for internal and external auditors.",
      icon: ShieldCheck,
      accent: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
      ring: "ring-violet-400/30",
      actions: [
        { key: "bank-recon", label: "Bank Reconciliation", icon: Landmark, hint: "Reconcile a bank statement", kind: "Bank Recon", startStatus: "draft",
          fields: [
            { name: "bank", label: "Bank account", required: true },
            { name: "period", label: "Period", placeholder: "e.g. June 2026" },
            { name: "amount", label: "Statement balance", placeholder: "R 0.00" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "sign-off", label: "Recon Sign-off", icon: CheckCircle2, hint: "Sign off a reconciliation", kind: "Recon Sign-off", startStatus: "pending",
          fields: [
            { name: "reference", label: "Recon reference", required: true },
            { name: "signOff", label: "Signed off by" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "audit-pack", label: "Audit Pack", icon: FileCog, hint: "Compile evidence for auditors", kind: "Audit Pack", startStatus: "draft",
          fields: [
            { name: "period", label: "Period", required: true, placeholder: "e.g. FY26" },
            { name: "scope", label: "Scope", placeholder: "Statutory / internal" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/accounting")({
  head: () => ({
    meta: [
      { title: "Accounting — Impilo" },
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

// Unused icon reference to silence tree-shaking type warnings if any
void Building2; void Sparkles;
