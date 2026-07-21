import { createFileRoute } from "@tanstack/react-router";
import {
  FileCheck, Send, ShieldCheck, RotateCcw, AlertTriangle, CheckCircle2, Layers, Coins, ClipboardList, XCircle,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "claims",
  eyebrow: "Financial · Claims",
  title: "Claims",
  description: "Create, submit and track medical-scheme claims from finalised bills through to settlement.",
  heroHeadline: "Every finalised bill submitted, adjudicated and reconciled.",
  heroBlurb: "Build claims from finalised bills, submit them to schemes, work responses and rejections, and reconcile settlements.",
  heroBadge: "Live · Claims desk",
  heroCtas: [
    { label: "Create a claim", sectionKey: "capture", primary: true },
    { label: "Submit a claim", sectionKey: "capture" },
    { label: "Work rejections", sectionKey: "responses" },
  ],
  overviewKpis: (items) => {
    const total = items.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
    return [
      { label: "Claims", value: items.length, icon: Layers, accent: "from-primary/30 to-transparent" },
      { label: "Submitted", value: items.filter((i) => i.status === "submitted" || i.status === "adjudicating").length, icon: Send, accent: "from-sky-500/30 to-transparent" },
      { label: "Paid", value: items.filter((i) => i.status === "paid" || i.status === "settled").length, icon: CheckCircle2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Value submitted", value: fmtR(total), icon: Coins, accent: "from-indigo-500/30 to-transparent" },
    ];
  },
  sections: [
    {
      key: "capture",
      title: "Create & Submit",
      tagline: "Build · validate · send",
      description: "Build the claim from the finalised bill, validate it, and submit it to the scheme.",
      icon: FileCheck,
      accent: "from-primary/25 via-sky-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "create", label: "Create Claim", icon: FileCheck, hint: "Build a claim from a finalised bill", kind: "Claim", startStatus: "draft",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "bill", label: "Finalised bill", required: true },
            { name: "scheme", label: "Scheme", required: true },
            { name: "amount", label: "Amount (R)", type: "number", required: true },
          ]},
        { key: "validate", label: "Validate Claim", icon: ShieldCheck, hint: "Run pre-submission checks", kind: "Validation", startStatus: "pending",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
          ]},
        { key: "submit", label: "Submit Claim", icon: Send, hint: "Send to scheme adjudicator", kind: "Submission", startStatus: "submitted",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
            { name: "channel", label: "Channel", placeholder: "EDI / Portal" },
          ]},
      ],
    },
    {
      key: "responses",
      title: "Responses & Corrections",
      tagline: "Review · correct · resubmit",
      description: "Review scheme responses, correct rejections and resubmit within the scheme's rules.",
      icon: AlertTriangle,
      accent: "from-amber-500/25 via-yellow-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "review-response", label: "Review Claim Response", icon: ClipboardList, hint: "Work through adjudication response", kind: "Response Review", startStatus: "pending",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
            { name: "response", label: "Scheme response ref" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "correct", label: "Correct Claim", icon: RotateCcw, hint: "Correct a rejected line", kind: "Correction", startStatus: "pending",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
            { name: "issue", label: "Issue raised", required: true },
            { name: "reason", label: "Correction reason", required: true },
          ]},
        { key: "resubmit", label: "Resubmit Claim", icon: Send, hint: "Resubmit after correction", kind: "Resubmission", startStatus: "submitted",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
            { name: "reason", label: "Reason for resubmission", required: true },
          ]},
      ],
    },
    {
      key: "settlement",
      title: "Settlement & Closure",
      tagline: "Reconcile · close",
      description: "Reconcile settlements against submitted claims and close paid claims.",
      icon: CheckCircle2,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "reconcile", label: "Reconcile Settlement", icon: CheckCircle2, hint: "Match remittance to claim", kind: "Settlement", startStatus: "settled",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
            { name: "remittance", label: "Remittance ref", required: true },
            { name: "amount", label: "Settled amount (R)", type: "number", required: true },
          ]},
        { key: "close", label: "Close Claim", icon: XCircle, hint: "Close a completed claim", kind: "Closure", startStatus: "closed",
          fields: [
            { name: "claim", label: "Claim ID", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
  worklist: makeDefaultWorklist("claims", "Claims"),

  businessFlow: {
    moduleKey: "claims",
    title: "Create & Submit Claim",
    purpose: "Build a claim from a finalised bill and submit it to the scheme.",
    globalRules: [],
    events: [],
    acceptance: [],
    completionKind: "Claim",
    completionStatus: "submitted",
    completionLabel: "Claim submitted",
    titleFrom: (v) => `${v.patient ?? "Patient"} · ${v.scheme ?? "Scheme"}`,
    subtitleFrom: (v) => [v.bill && `Bill ${v.bill}`, v.amount && `R ${v.amount}`].filter(Boolean).join(" · "),
    steps: [
      { key: "context", title: "Patient & bill", description: "Confirm patient and the finalised bill this claim is built from.",
        fields: [
          { name: "patient", label: "Patient", required: true },
          { name: "bill", label: "Finalised bill", required: true },
        ]},
      { key: "scheme", title: "Scheme & plan", description: "Capture the scheme, plan and membership context.",
        fields: [
          { name: "scheme", label: "Scheme", required: true },
          { name: "plan", label: "Plan / Option" },
          { name: "membership", label: "Membership no." },
        ]},
      { key: "lines", title: "Claim lines", description: "Confirm the claim lines carried over from the finalised bill.",
        fields: [
          { name: "amount", label: "Total amount (R)", type: "number", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
        checklist: ["Coding signed off", "Authorisation confirmed", "Supporting documents attached"] },
      { key: "documents", title: "Supporting documents", description: "Attach any documents required by the scheme.",
        fields: [
          { name: "documents", label: "Documents attached", placeholder: "List required documents" },
        ]},
      { key: "review", title: "Review", description: "Review the claim before submitting to the scheme." },
      { key: "outcome", title: "Completed", description: "Claim submitted and pending adjudication." },
    ],
  },
};

export const Route = createFileRoute("/_app/claims")({
  head: () => ({
    meta: [
      { title: "Claims — Impilo" },
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
