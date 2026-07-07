import { createFileRoute } from "@tanstack/react-router";
import {
  Search, UserCog, FileCode, Coins, Wallet, Building2, Network, ClipboardList,
  ShieldCheck, FileCog, Landmark, Layers,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "funding",
  eyebrow: "Operational · Funding",
  title: "Funding",
  description: "Scheme rules, MCO/administrator configuration, CPT costs and claim XML for every payer.",
  heroHeadline: "The single source of truth for who pays, how much, and how it's claimed.",
  heroBlurb: "Curate carriers, MCOs and administrators, define claim rules, and keep tariff and CPT costs aligned.",
  heroBadge: "Live · Funding rules",
  heroCtas: [
    { label: "Search a carrier", sectionKey: "carriers", primary: true },
    { label: "Maintain funds", sectionKey: "funds" },
    { label: "Claim configuration", sectionKey: "configuration" },
  ],
  overviewKpis: (items) => {
    const active = items.filter((i) => i.status === "active" || i.status === "verified").length;
    return [
      { label: "Rules & records", value: items.length, icon: Layers, accent: "from-primary/30 to-transparent" },
      { label: "Active", value: active, icon: ShieldCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Draft", value: items.filter((i) => i.status === "draft").length, icon: FileCog, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Retired", value: items.filter((i) => i.status === "retired").length, icon: Landmark, accent: "from-slate-500/30 to-transparent", tone: "muted" },
    ];
  },
  sectionKpis: (section, items) => {
    if (section.key === "carriers") {
      const carriers = items.filter((i) => ["Carrier", "MCO", "Administrator"].includes(String(i.fields["Kind"] ?? "")));
      return [
        { label: "Carriers", value: items.filter((i) => i.fields["Kind"] === "Carrier").length, icon: Building2, accent: "from-primary/30 to-transparent" },
        { label: "MCOs", value: items.filter((i) => i.fields["Kind"] === "MCO").length, icon: Network, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Administrators", value: items.filter((i) => i.fields["Kind"] === "Administrator").length, icon: UserCog, accent: "from-sky-500/30 to-transparent" },
        { label: "Total", value: carriers.length, icon: Layers, accent: "from-slate-500/30 to-transparent", tone: "muted" },
      ];
    }
    if (section.key === "funds") {
      return [
        { label: "Funds", value: items.filter((i) => i.fields["Kind"] === "Fund").length, icon: Wallet, accent: "from-primary/30 to-transparent" },
        { label: "Claim rules", value: items.filter((i) => i.fields["Kind"] === "Claim Rule").length, icon: ClipboardList, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "CPT costs", value: items.filter((i) => i.fields["Kind"] === "CPT Cost").length, icon: Coins, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      ];
    }
    if (section.key === "configuration") {
      return [
        { label: "Claim XML profiles", value: items.filter((i) => i.fields["Kind"] === "Claim XML").length, icon: FileCode, accent: "from-primary/30 to-transparent" },
        { label: "Hospital configs", value: items.filter((i) => i.fields["Kind"] === "Hospital").length, icon: Building2, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      ];
    }
    return [];
  },
  sections: [
    {
      key: "carriers",
      title: "Carriers & MCOs",
      tagline: "Carriers · MCOs · administrators",
      description: "The payer graph — search carriers, register MCOs and maintain the administrators who process on their behalf.",
      icon: Network,
      accent: "from-primary/25 via-indigo-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "carrier-search", label: "Carrier Search", icon: Search, hint: "Look up a carrier, plan or option", kind: "Carrier", startStatus: "active",
          fields: [
            { name: "carrier", label: "Carrier / Scheme", required: true },
            { name: "plan", label: "Plan / Option" },
            { name: "reference", label: "Reference", placeholder: "e.g. member no." },
          ]},
        { key: "maintain-mcos", label: "Maintain MCOs", icon: Network, hint: "Managed care organisations", kind: "MCO", startStatus: "active",
          fields: [
            { name: "name", label: "MCO name", required: true },
            { name: "code", label: "MCO code" },
            { name: "contact", label: "Contact" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "maintain-administrators", label: "Maintain Administrators", icon: UserCog, hint: "Scheme administrators", kind: "Administrator", startStatus: "active",
          fields: [
            { name: "name", label: "Administrator", required: true },
            { name: "code", label: "Admin code" },
            { name: "contact", label: "Primary contact" },
          ]},
      ],
    },
    {
      key: "funds",
      title: "Funds & Rules",
      tagline: "Funds · claim rules · CPT costs",
      description: "The commercial rulebook — configure funds, claim rules and CPT cost tables that drive every claim.",
      icon: Wallet,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "maintain-funds", label: "Maintain Funds", icon: Wallet, hint: "Fund and benefit configuration", kind: "Fund", startStatus: "active",
          fields: [
            { name: "fund", label: "Fund", required: true },
            { name: "plan", label: "Plan / Option" },
            { name: "rate", label: "Rate", placeholder: "e.g. 100% of scheme rate" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "maintain-claim-rules", label: "Maintain Claim Rules", icon: ClipboardList, hint: "Claim eligibility and edits", kind: "Claim Rule", startStatus: "draft",
          fields: [
            { name: "name", label: "Rule name", required: true },
            { name: "scope", label: "Scope", placeholder: "Scheme / Plan / Facility" },
            { name: "definition", label: "Definition", type: "textarea" },
          ]},
        { key: "maintain-cpt", label: "Maintain CPT Costs", icon: Coins, hint: "CPT / tariff cost tables", kind: "CPT Cost", startStatus: "active",
          fields: [
            { name: "code", label: "CPT code", required: true, placeholder: "e.g. 47562" },
            { name: "description", label: "Description" },
            { name: "amount", label: "Amount (R)", type: "number" },
            { name: "effective", label: "Effective from", placeholder: "YYYY-MM-DD" },
          ]},
      ],
    },
    {
      key: "configuration",
      title: "Claim Configuration",
      tagline: "Claim XML · hospital",
      description: "Claim submission formats and hospital-level funding configuration.",
      icon: FileCog,
      accent: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
      ring: "ring-violet-400/30",
      actions: [
        { key: "maintain-claim-xml", label: "Maintain Claim XML", icon: FileCode, hint: "Claim payload templates", kind: "Claim XML", startStatus: "draft",
          fields: [
            { name: "profile", label: "Profile name", required: true },
            { name: "version", label: "Version", placeholder: "e.g. 6.0" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "maintain-hospital", label: "Maintain Hospital", icon: Building2, hint: "Hospital-level funding config", kind: "Hospital", startStatus: "active",
          fields: [
            { name: "facility", label: "Hospital", required: true },
            { name: "code", label: "Facility code" },
            { name: "practice", label: "Practice number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/funding")({
  head: () => ({
    meta: [
      { title: "Funding — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
