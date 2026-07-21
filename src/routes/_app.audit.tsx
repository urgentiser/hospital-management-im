import { createFileRoute } from "@tanstack/react-router";
import {
  ScrollText, Search, ShieldCheck, Download, Lock, ClipboardCheck, FileSignature,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { AuditDetailTable } from "@/components/audit-detail";

const config: ModuleConsoleConfig = {
  moduleKey: "audit",
  platformScoped: true,
  eyebrow: "Platform · Audit Trail",
  title: "Audit Trail",
  description: "Immutable log of every operator action, integration event and system decision — searchable, exportable, sealable.",
  heroHeadline: "One truth. Never rewritten.",
  heroBlurb: "Query by actor, module or correlation. Export for compliance. Seal a period so the record can never be altered.",
  heroBadge: "Live · Audit",
  heroCtas: [
    { label: "Search entries", sectionKey: "search", primary: true },
    { label: "Export period", sectionKey: "export" },
    { label: "Seal period", sectionKey: "seal" },
  ],
  overviewKpis: (items) => [
    { label: "Entries", value: items.length, icon: ScrollText, accent: "from-primary/30 to-transparent" },
    { label: "Logged (24h)", value: items.filter((i) => i.status === "logged").length, icon: Search, accent: "from-sky-500/30 to-transparent" },
    { label: "Reviewed", value: items.filter((i) => i.status === "reviewed").length, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Sealed", value: items.filter((i) => i.status === "sealed").length, icon: Lock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
  ],
  overviewExtras: (items) => <AuditDetailTable items={items} />,
  sections: [
    {
      key: "search", title: "Search & Drill", tagline: "Query · trace",
      description: "Search the audit by actor, module or correlation and drill into a single event.",
      icon: Search, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "search", label: "Search Audit", icon: Search, hint: "Full-text and structured search", kind: "Search", startStatus: "logged",
          fields: [
            { name: "actor", label: "Actor" },
            { name: "module", label: "Module" },
            { name: "correlation", label: "Correlation ID" },
            { name: "from", label: "From", placeholder: "YYYY-MM-DD" },
            { name: "to", label: "To", placeholder: "YYYY-MM-DD" },
          ]},
        { key: "review", label: "Mark Reviewed", icon: ShieldCheck, hint: "Compliance officer sign-off", kind: "Review", startStatus: "reviewed",
          fields: [
            { name: "entryId", label: "Entry ID", required: true },
            { name: "note", label: "Reviewer note", type: "textarea" },
          ]},
      ],
    },
    {
      key: "export", title: "Export", tagline: "PDF · CSV",
      description: "Export a period or a saved query for auditors, boards or regulators.",
      icon: Download, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "export-period", label: "Export Period", icon: Download, hint: "Export by period", kind: "Export", startStatus: "generated",
          fields: [
            { name: "period", label: "Period", required: true, placeholder: "2026-06" },
            { name: "format", label: "Format", placeholder: "PDF / CSV" },
          ]},
      ],
    },
    {
      key: "seal", title: "Seal & Certify", tagline: "Immutability",
      description: "Seal a closed period. Sealed periods cannot be modified — only certified copies exported.",
      icon: Lock, accent: "from-amber-500/25 via-orange-500/15 to-transparent", ring: "ring-amber-400/30",
      actions: [
        { key: "seal", label: "Seal Period", icon: Lock, hint: "Cryptographically seal a period", kind: "Seal", startStatus: "sealed",
          fields: [
            { name: "period", label: "Period", required: true },
            { name: "sealedBy", label: "Sealed by", required: true },
          ], destructive: true },
        { key: "certify", label: "Issue Certificate", icon: FileSignature, hint: "Issue a signed certificate of authenticity", kind: "Certificate", startStatus: "issued",
          fields: [
            { name: "period", label: "Period", required: true },
            { name: "recipient", label: "Recipient" },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "audit",
    title: "Log · Review · Seal",
    purpose: "Every action produces a durable audit entry. Compliance reviews entries, then closed periods are sealed so the record is provably immutable.",
    legacySource: "Rich/Platform/AuditTrail.Implet",
    routeFamily: ["/audit", "/audit/{id}", "/audit/exports"],
    completionKind: "Audit Batch",
    completionStatus: "sealed",
    completionLabel: "Period sealed",
    titleFrom: (v) => `Audit · ${v.period ?? v.correlation ?? "search"}`,
    subtitleFrom: (v) => [v.actor, v.module].filter(Boolean).join(" · "),
    events: ["AuditLogged", "AuditReviewed", "AuditExported", "AuditPeriodSealed", "AuditCertificateIssued"],
    handoffs: ["Integrations", "Administration", "Notifications"],
    globalRules: [
      "Audit entries are append-only and identified by content hash.",
      "Every entry stores actor, module, correlation ID, before/after snapshot and timestamp.",
      "Sealed periods are cryptographically chained to previous seals.",
      "Exports include the seal hash so integrity is verifiable offline.",
    ],
    acceptance: [
      "Perform an action anywhere in the app and see the audit entry appear.",
      "Search by correlation and see all related entries in order.",
      "Seal a closed month and export a certified PDF of the entries.",
    ],
    steps: [
      { key: "log", title: "Action logged", description: "Every state change writes an audit entry automatically.",
        events: ["AuditLogged"] },
      { key: "search", title: "Search & drill", description: "Compliance searches by actor, module or correlation.",
        fields: [
          { name: "actor", label: "Actor" },
          { name: "correlation", label: "Correlation ID" },
        ] },
      { key: "review", title: "Review sensitive entries", description: "Reviewer signs off on entries flagged as sensitive.",
        checklist: ["Sensitive entries reviewed", "Reviewer note captured"],
        events: ["AuditReviewed"] },
      { key: "export", title: "Export batch", description: "Export a period, saved query or single correlation.",
        fields: [{ name: "period", label: "Period" }, { name: "format", label: "Format", type: "select", options: ["PDF", "CSV", "JSON"] }],
        events: ["AuditExported"] },
      { key: "seal", title: "Seal closed period", description: "Cryptographically seal the period. Future writes to that period are refused.",
        fields: [{ name: "sealedBy", label: "Sealed by", required: true }],
        events: ["AuditPeriodSealed"] },
      { key: "certify", title: "Issue certificate", description: "Issue a signed certificate of authenticity for the sealed period.",
        events: ["AuditCertificateIssued"] },
    ],
  },
};

export const Route = createFileRoute("/_app/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
