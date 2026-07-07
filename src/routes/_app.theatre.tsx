import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock, ClipboardList, Boxes, PackageOpen, Wrench, ClipboardCheck,
  Ban, Receipt, Activity, ShieldCheck, Timer, Sparkles,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "theatre",
  eyebrow: "Clinical · Theatre",
  title: "Theatre Management",
  description: "Preference cards, stock templates, trolley prep, procedures, register and billing sign-off.",
  heroHeadline: "Every slot prepped, tracked and billed — from preference card to sign-off.",
  heroBlurb: "Set up preference cards and stock templates, prepare the trolley, run the register and approve the bill in one console.",
  heroBadge: "Live · Theatre board",
  heroCtas: [
    { label: "Prepare a trolley", sectionKey: "preparation", primary: true },
    { label: "Complete the register", sectionKey: "operations" },
    { label: "Approve theatre bill", sectionKey: "billing" },
  ],
  overviewKpis: (items) => {
    const booked = items.filter((i) => i.status === "booked").length;
    const inProgress = items.filter((i) => i.status === "in-progress").length;
    const completed = items.filter((i) => i.status === "completed").length;
    const billed = items.filter((i) => i.status === "billed").length;
    return [
      { label: "Booked", value: booked, icon: CalendarClock, accent: "from-primary/30 to-transparent" },
      { label: "In progress", value: inProgress, icon: Activity, accent: "from-sky-500/30 to-transparent" },
      { label: "Completed", value: completed, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Billed", value: billed, icon: Receipt, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    ];
  },
  sections: [
    {
      key: "preparation",
      title: "Preparation",
      tagline: "Preference · stock · trolley",
      description: "Preference cards, stock templates and trolley preparation for the day's list.",
      icon: Boxes,
      accent: "from-sky-500/25 via-primary/15 to-transparent",
      ring: "ring-sky-400/30",
      actions: [
        { key: "edit-preference-card", label: "Edit Preference Card", icon: ClipboardList, hint: "Surgeon preference card", kind: "Preference Card", startStatus: "active",
          fields: [
            { name: "surgeon", label: "Surgeon", required: true },
            { name: "procedure", label: "Procedure", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "edit-stock-template", label: "Edit Stock Template", icon: Boxes, hint: "Consumables/implants template", kind: "Stock Template", startStatus: "active",
          fields: [
            { name: "template", label: "Template name", required: true },
            { name: "items", label: "Items", type: "textarea", placeholder: "One per line" },
          ]},
        { key: "prepare-trolley", label: "Prepare Trolley", icon: PackageOpen, hint: "Pull stock for a booked case", kind: "Prepare Trolley", startStatus: "booked",
          fields: [
            { name: "reference", label: "Booking reference", required: true },
            { name: "theatre", label: "Theatre" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "operations",
      title: "Operating Theatre",
      tagline: "Procedure · register · cancel",
      description: "Manage the procedure, complete the theatre register or cancel a case.",
      icon: Activity,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "edit-theatre-procedure", label: "Edit Theatre Procedure", icon: Wrench, hint: "Update procedure details", kind: "Theatre Procedure", startStatus: "in-progress",
          fields: [
            { name: "reference", label: "Booking reference", required: true },
            { name: "procedure", label: "Procedure", required: true },
            { name: "duration", label: "Actual duration" },
          ]},
        { key: "complete-register", label: "Complete Register", icon: ClipboardCheck, hint: "Sign the theatre register", kind: "Complete Register", startStatus: "completed",
          fields: [
            { name: "reference", label: "Booking reference", required: true },
            { name: "team", label: "Team", type: "textarea", placeholder: "Surgeon, Anaesthetist, Scrub…" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "cancel-procedure", label: "Cancel Procedure", icon: Ban, hint: "Cancel a booked case", kind: "Cancel Procedure", startStatus: "cancelled",
          fields: [
            { name: "reference", label: "Booking reference", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "billing",
      title: "Theatre Billing",
      tagline: "Approve · charge",
      description: "Approve theatre bill against the case and hand-off to billing.",
      icon: Receipt,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "approve-theatre-bill", label: "Approve Theatre Bill", icon: ShieldCheck, hint: "Approve theatre time and consumables", kind: "Approve Theatre Bill", startStatus: "billed",
          fields: [
            { name: "reference", label: "Booking reference", required: true },
            { name: "amount", label: "Amount (R)", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "dashboard",
      title: "Dashboard",
      tagline: "Slot utilisation",
      description: "Slot utilisation, cancellations and turnaround time.",
      icon: Timer,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "view-dashboard", label: "View Dashboard", icon: Sparkles, hint: "Open theatre dashboard", kind: "Dashboard", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "period", label: "Period" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/theatre")({
  head: () => ({
    meta: [
      { title: "Theatre Management — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
