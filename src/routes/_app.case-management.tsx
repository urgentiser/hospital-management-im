import { createFileRoute } from "@tanstack/react-router";
import {
  UserCog, ClipboardCheck, Users, MessageSquarePlus, ArrowUpCircle,
  Receipt, RotateCcw, Wrench, Eye, Plus, Settings2, CalendarDays,
  AlertTriangle, Flag, Briefcase, Search,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "case-management",
  eyebrow: "Operational · Cases",
  title: "Case Management",
  description: "Long-running case timelines with multi-party workflows, SLA tracking and escalation.",
  heroHeadline: "Every case, every stakeholder, on one calm timeline.",
  heroBlurb: "Route work to the right case manager, keep bills tidy, and escalate to national when SLAs slip.",
  heroBadge: "Live · Case desk",
  heroCtas: [
    { label: "Open a case", sectionKey: "lifecycle", primary: true },
    { label: "Escalate to national", sectionKey: "escalation" },
    { label: "Roster & administration", sectionKey: "administration" },
  ],
  overviewKpis: (items) => {
    const open = items.filter((i) => !["closed", "escalated"].includes(i.status)).length;
    const escalated = items.filter((i) => i.status === "escalated").length;
    const overdue = items.filter((i) => {
      const sla = Number(i.fields["SLA Days"] ?? 0);
      const days = (Date.now() - new Date(i.createdAt).getTime()) / 86_400_000;
      return sla > 0 && days > sla && i.status !== "closed";
    }).length;
    const unresolved = items.reduce((n, i) => n + (Number(i.fields["Open Issues"] ?? 0) || 0), 0);
    return [
      { label: "Open cases", value: open, icon: Briefcase, accent: "from-primary/30 to-transparent" },
      { label: "Escalated", value: escalated, icon: Flag, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      { label: "Overdue SLA", value: overdue, icon: AlertTriangle, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Unresolved", value: unresolved, icon: Wrench, accent: "from-slate-500/30 to-transparent", tone: "muted" },
    ];
  },
  sectionKpis: (section, items) => {
    if (section.key === "lifecycle") {
      return [
        { label: "Intake", value: items.filter((i) => i.status === "intake").length, icon: Plus, accent: "from-sky-500/30 to-transparent" },
        { label: "Assessment", value: items.filter((i) => i.status === "assessment").length, icon: Search, accent: "from-primary/30 to-transparent" },
        { label: "In progress", value: items.filter((i) => i.status === "in-progress").length, icon: Wrench, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Closed", value: items.filter((i) => i.status === "closed").length, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      ];
    }
    if (section.key === "escalation") {
      return [
        { label: "Escalated", value: items.filter((i) => i.status === "escalated").length, icon: ArrowUpCircle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
        { label: "Open enquiries", value: items.reduce((n, i) => n + (Number(i.fields["Open Issues"] ?? 0) || 0), 0), icon: MessageSquarePlus, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Critical", value: items.filter((i) => i.fields.Priority === "Critical").length, icon: Flag, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      ];
    }
    if (section.key === "billing") {
      const finalised = items.filter((i) => String(i.fields["Bill Status"] ?? "") === "finalised").length;
      return [
        { label: "Bills open", value: items.length - finalised, icon: Receipt, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Finalised", value: finalised, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Reopened", value: items.filter((i) => String(i.fields["Bill Status"] ?? "") === "reopened").length, icon: RotateCcw, accent: "from-slate-500/30 to-transparent", tone: "muted" },
      ];
    }
    return [
      { label: "Case managers", value: 8, icon: Users, accent: "from-primary/30 to-transparent" },
      { label: "Regions", value: 4, icon: CalendarDays, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    ];
  },
  sections: [
    {
      key: "lifecycle",
      title: "Case Lifecycle",
      tagline: "Assign · manage · resolve",
      description: "From intake to closure — assign cases, drive resolution and keep every action on the timeline.",
      icon: Briefcase,
      accent: "from-primary/25 via-indigo-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "assign-cases", label: "Assign Cases", icon: UserCog, hint: "Assign or reassign case ownership", kind: "Assign Cases", startStatus: "intake",
          fields: [
            { name: "reference", label: "Case reference", required: true, placeholder: "CASE-…" },
            { name: "owner", label: "Assign to", required: true },
            { name: "priority", label: "Priority", placeholder: "Low / Medium / High / Critical" },
          ]},
        { key: "find-case", label: "Find Case", icon: Search, hint: "Search across all cases", kind: "Find Case", startStatus: "active",
          fields: [
            { name: "query", label: "Search", required: true, placeholder: "ID, patient, owner…" },
          ]},
        { key: "manage-case", label: "Manage Case", icon: Eye, hint: "Open the case workspace", kind: "Manage Case", startStatus: "in-progress",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "summary", label: "Update", type: "textarea" },
          ]},
        { key: "resolve", label: "Resolve Issues", icon: Wrench, hint: "Close outstanding issues on a case", kind: "Resolve Issues", startStatus: "closed",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "resolution", label: "Resolution", required: true, type: "textarea" },
          ]},
      ],
    },
    {
      key: "escalation",
      title: "Escalation & Enquiries",
      tagline: "Enquiries · national escalation",
      description: "Capture stakeholder enquiries and escalate stuck cases to the national team with a full audit trail.",
      icon: Flag,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "enquiries", label: "Enquiries", icon: MessageSquarePlus, hint: "Log a stakeholder enquiry", kind: "Enquiry", startStatus: "pending",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "channel", label: "Channel", placeholder: "Call / Email / Portal" },
            { name: "message", label: "Message", required: true, type: "textarea" },
          ]},
        { key: "escalate", label: "Escalation to National", icon: ArrowUpCircle, hint: "Escalate a case beyond the region", kind: "Escalate", startStatus: "escalated",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "to", label: "Escalate to", required: true, placeholder: "National Case Desk" },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "billing",
      title: "Billing",
      tagline: "Checks · finalise · unfinal",
      description: "Bill-side controls attached to a case — run billing checks, finalise or reopen bills under audit.",
      icon: Receipt,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "billing-checks", label: "Billing Checks", icon: ClipboardCheck, hint: "Run pre-bill checks on a case", kind: "Billing Checks", startStatus: "active",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "finalise-bill", label: "Finalise Bill", icon: Receipt, hint: "Close and submit the bill", kind: "Finalise Bill", startStatus: "closed",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "amount", label: "Total (R)", type: "number" },
          ]},
        { key: "unfinal-bill", label: "Unfinal Bill", icon: RotateCcw, hint: "Reopen a finalised bill", kind: "Unfinal Bill", startStatus: "active",
          fields: [
            { name: "reference", label: "Case reference", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "administration",
      title: "Administration",
      tagline: "Roster · configuration",
      description: "Maintain the case manager roster and configuration behind the case desk.",
      icon: Settings2,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "roster", label: "Case Manager Roster", icon: Users, hint: "Maintain rotations and coverage", kind: "Roster", startStatus: "active",
          fields: [
            { name: "manager", label: "Case manager", required: true },
            { name: "period", label: "Period", placeholder: "YYYY-MM" },
            { name: "coverage", label: "Coverage", placeholder: "Region / Facility" },
          ]},
        { key: "case-admin", label: "Case Administration", icon: Settings2, hint: "Configure workflows and templates", kind: "Case Admin", startStatus: "active",
          fields: [
            { name: "workflow", label: "Workflow", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/case-management")({
  head: () => ({
    meta: [
      { title: "Case Management — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
