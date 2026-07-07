import { createFileRoute } from "@tanstack/react-router";
import {
  BedDouble, Sparkles, Brush, Wrench, HeartPulse, Users, ClipboardCheck,
  Printer, Receipt, ClipboardList, Stethoscope, Building2, Activity,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "ward",
  eyebrow: "Clinical · Ward",
  title: "Ward Management",
  description: "Bed occupancy, nursing operations, ward billing and printed ward documentation.",
  heroHeadline: "The bed board, nurse hand-off and ward billing — in one console.",
  heroBlurb: "Assign beds, run housekeeping, capture ward treatments and print the paperwork without leaving the page.",
  heroBadge: "Live · Bed board",
  heroCtas: [
    { label: "Open bed board", sectionKey: "occupancy", primary: true },
    { label: "Nursing card", sectionKey: "nursing" },
    { label: "Bill ward treatments", sectionKey: "billing" },
  ],
  overviewKpis: (items) => {
    const occupied = items.filter((i) => i.status === "occupied").length;
    const available = items.filter((i) => i.status === "available").length;
    const cleaning = items.filter((i) => i.status === "cleaning").length;
    return [
      { label: "Occupied", value: occupied, icon: BedDouble, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Available", value: available, icon: Sparkles, accent: "from-primary/30 to-transparent" },
      { label: "Cleaning", value: cleaning, icon: Brush, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Total beds", value: items.length, icon: Building2, accent: "from-slate-500/30 to-transparent", tone: "muted" },
    ];
  },
  sections: [
    {
      key: "occupancy",
      title: "Occupancy & Beds",
      tagline: "Board · accommodation · specialists",
      description: "Track hospital occupancy, edit accommodation and route additional specialists.",
      icon: BedDouble,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "occupancy", label: "Hospital Occupancy", icon: BedDouble, hint: "Live occupancy across the ward", kind: "Occupancy", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "ward", label: "Ward" },
          ]},
        { key: "edit-accommodation", label: "Edit Accommodation", icon: Wrench, hint: "Change room/bed setup", kind: "Edit Accommodation", startStatus: "active",
          fields: [
            { name: "ward", label: "Ward", required: true },
            { name: "bed", label: "Bed", required: true },
            { name: "type", label: "Accommodation type", placeholder: "Private / Semi-private / General" },
          ]},
        { key: "additional-specialist", label: "Additional Specialist", icon: Users, hint: "Attach a specialist to the case", kind: "Additional Specialist", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "specialist", label: "Specialist", required: true },
            { name: "role", label: "Role", placeholder: "Consulting / Attending" },
          ]},
      ],
    },
    {
      key: "nursing",
      title: "Nursing Care",
      tagline: "Nursing card · treatments · documents",
      description: "Maintain the nursing card and record ward treatments per patient.",
      icon: HeartPulse,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "edit-nursing-card", label: "Edit Nursing Card", icon: ClipboardList, hint: "Capture observations and orders", kind: "Nursing Card", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "ward", label: "Ward" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "edit-ward-treatments", label: "Edit Ward Treatments", icon: Stethoscope, hint: "Record procedures/treatments delivered", kind: "Ward Treatments", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "treatment", label: "Treatment", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "print-ward-documents", label: "Print Ward Documents", icon: Printer, hint: "Print pack for the current ward", kind: "Print Ward Documents", startStatus: "active",
          fields: [
            { name: "ward", label: "Ward", required: true },
            { name: "documents", label: "Documents", placeholder: "e.g. Wristband, Chart, Consent" },
          ]},
      ],
    },
    {
      key: "billing",
      title: "Ward Billing",
      tagline: "Charges · finalise",
      description: "Bill ward-delivered treatments and consumables against the admission.",
      icon: Receipt,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "bill-ward-treatments", label: "Bill Ward Treatments", icon: Receipt, hint: "Post ward charges", kind: "Bill Ward Treatments", startStatus: "active",
          fields: [
            { name: "reference", label: "Admission reference", required: true },
            { name: "amount", label: "Amount (R)", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "billing-check", label: "Ward Billing Check", icon: ClipboardCheck, hint: "Reconcile ward charges before finalise", kind: "Ward Billing Check", startStatus: "active",
          fields: [
            { name: "reference", label: "Admission reference", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
      ],
    },
    {
      key: "dashboard",
      title: "Dashboard",
      tagline: "Ops overview",
      description: "Ward-level throughput, LOS and occupancy trend at a glance.",
      icon: Activity,
      accent: "from-sky-500/25 via-primary/15 to-transparent",
      ring: "ring-sky-400/30",
      actions: [
        { key: "view-dashboard", label: "View Dashboard", icon: Activity, hint: "Open ward dashboard", kind: "Dashboard", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "period", label: "Period" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/ward")({
  head: () => ({
    meta: [
      { title: "Ward Management — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
