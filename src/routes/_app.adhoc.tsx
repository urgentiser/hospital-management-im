import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardCheck, Coins, FileText, PackagePlus, Receipt, ShieldCheck,
  Layers, CheckCircle2, FileCog, RotateCcw, Send, HandCoins, Building2,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "adhoc",
  eyebrow: "Financial · AdHoc",
  title: "AdHoc",
  description: "Adhoc charges, credits, billing checks and supplier invoices — the one-off financial events outside the standard flow.",
  heroHeadline: "Capture the exceptions with the same rigour as the routine.",
  heroBlurb: "Log miscellaneous charges, record supplier invoices, run billing checks and approve one-off adjustments with a full audit trail.",
  heroBadge: "Live · AdHoc queue",
  heroCtas: [
    { label: "Add a charge", sectionKey: "charges", primary: true },
    { label: "Record supplier invoice", sectionKey: "suppliers" },
    { label: "Run billing checks", sectionKey: "checks" },
  ],
  overviewKpis: (items) => {
    const total = items.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
    return [
      { label: "All items", value: items.length, icon: Layers, accent: "from-primary/30 to-transparent" },
      { label: "Approved", value: items.filter((i) => i.status === "approved").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Captured", value: items.filter((i) => i.status === "captured").length, icon: FileCog, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Net value", value: fmtR(total), icon: Coins, accent: "from-sky-500/30 to-transparent" },
    ];
  },
  sectionKpis: (section, items) => {
    const scoped = items.filter((i) => section.actions.map((a) => a.kind).includes(String(i.fields["Kind"] ?? "")));
    const value = scoped.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
    if (section.key === "charges") {
      return [
        { label: "Charges", value: scoped.length, icon: Receipt, accent: "from-primary/30 to-transparent" },
        { label: "Approved", value: scoped.filter((i) => i.status === "approved" || i.status === "posted").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Captured value", value: fmtR(value), icon: Coins, accent: "from-sky-500/30 to-transparent" },
      ];
    }
    if (section.key === "suppliers") {
      return [
        { label: "Invoices", value: scoped.length, icon: FileText, accent: "from-primary/30 to-transparent" },
        { label: "Posted", value: scoped.filter((i) => i.status === "posted").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Invoice value", value: fmtR(value), icon: Coins, accent: "from-sky-500/30 to-transparent" },
      ];
    }
    if (section.key === "checks") {
      return [
        { label: "Checks", value: scoped.length, icon: ShieldCheck, accent: "from-primary/30 to-transparent" },
        { label: "Passed", value: scoped.filter((i) => i.status === "approved" || i.status === "posted").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Flagged", value: scoped.filter((i) => i.status === "rejected").length, icon: FileCog, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      ];
    }
    return [];
  },
  sections: [
    {
      key: "charges",
      title: "Miscellaneous Charges",
      tagline: "One-off charges · credits · adjustments",
      description: "Capture manual charges, credits, discounts and write-offs that fall outside the standard billing flow.",
      icon: Receipt,
      accent: "from-primary/25 via-indigo-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "miscellaneous-charge", label: "Miscellaneous Charge", icon: Receipt, hint: "Add a one-off charge to a patient", kind: "Misc Charge", startStatus: "captured",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "description", label: "Description", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "reference", label: "Reference", placeholder: "Visit / invoice" },
          ]},
        { key: "credit-adjustment", label: "Credit / Discount", icon: HandCoins, hint: "Apply a credit or discount", kind: "Credit", startStatus: "captured",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00 (minus for credit)" },
            { name: "reason", label: "Reason", required: true },
          ]},
        { key: "write-off", label: "Write-off", icon: RotateCcw, hint: "Write off an outstanding balance", kind: "Write-off", startStatus: "pending", destructive: true,
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "reason", label: "Reason", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "suppliers",
      title: "Supplier Invoices",
      tagline: "Supplier billing · procurement",
      description: "Record supplier invoices, allocate them to cost centres and post them into the ledger.",
      icon: PackagePlus,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "supplier-invoice", label: "Supplier Invoice", icon: FileText, hint: "Capture a supplier invoice", kind: "Supplier Invoice", startStatus: "captured",
          fields: [
            { name: "supplier", label: "Supplier", required: true },
            { name: "invoice", label: "Invoice number", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
            { name: "date", label: "Invoice date", placeholder: "YYYY-MM-DD" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "supplier-credit", label: "Supplier Credit Note", icon: RotateCcw, hint: "Record a supplier credit note", kind: "Supplier Credit", startStatus: "captured",
          fields: [
            { name: "supplier", label: "Supplier", required: true },
            { name: "reference", label: "Credit note", required: true },
            { name: "amount", label: "Amount", required: true, placeholder: "R 0.00 (minus)" },
            { name: "reason", label: "Reason" },
          ]},
        { key: "post-supplier", label: "Post to Ledger", icon: Send, hint: "Post captured invoices to GL", kind: "Supplier Post", startStatus: "pending",
          fields: [
            { name: "batch", label: "Batch reference", required: true },
            { name: "count", label: "Item count", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "checks",
      title: "Billing Checks",
      tagline: "Pre-bill audits · compliance",
      description: "Run pre-bill audits, flag anomalies and manage the checks that keep claims clean before submission.",
      icon: ShieldCheck,
      accent: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
      ring: "ring-violet-400/30",
      actions: [
        { key: "manage-billing-checks", label: "Manage Billing Checks", icon: ClipboardCheck, hint: "Configure a billing check rule", kind: "Billing Check", startStatus: "draft",
          fields: [
            { name: "name", label: "Check name", required: true },
            { name: "scope", label: "Scope", placeholder: "Scheme / ward / discipline" },
            { name: "definition", label: "Definition", type: "textarea" },
          ]},
        { key: "run-checks", label: "Run Billing Checks", icon: ShieldCheck, hint: "Execute the pre-bill audit", kind: "Check Run", startStatus: "pending",
          fields: [
            { name: "batch", label: "Batch / period", required: true },
            { name: "scope", label: "Scope" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "resolve-flag", label: "Resolve Flagged Item", icon: CheckCircle2, hint: "Close out a flagged exception", kind: "Check Flag", startStatus: "pending",
          fields: [
            { name: "reference", label: "Flag reference", required: true },
            { name: "reason", label: "Resolution", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/adhoc")({
  head: () => ({
    meta: [
      { title: "AdHoc — Impilo" },
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

void Building2;
