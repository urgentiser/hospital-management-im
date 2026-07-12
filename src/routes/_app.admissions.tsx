import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus, Eye, MapPin, ArrowRightLeft, LogOut, Undo2, Baby, Ban, StopCircle,
  Receipt, FileText, ClipboardCheck, ShieldOff, BedDouble, Clock, ShieldAlert,
  Building2, HeartPulse, ClipboardList, Wallet,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "admissions",
  eyebrow: "Clinical · Admissions Service",
  title: "Admissions",
  description: "Admit, transfer, discharge and bill inpatients across every Life Healthcare facility.",
  heroHeadline: "One command centre for the entire inpatient journey.",
  heroBlurb: "From admission to discharge — track beds, authorisations and billing without leaving the console.",
  heroBadge: "Live · Bed board",
  heroCtas: [
    { label: "Admit a patient", sectionKey: "movement", primary: true },
    { label: "Billing & bills", sectionKey: "billing" },
    { label: "No-auth board", sectionKey: "authorisation" },
  ],
  overviewKpis: (items) => {
    const admitted = items.filter((i) => i.status === "admitted").length;
    const pending = items.filter((i) => i.status === "pending").length;
    const discharged = items.filter((i) => i.status === "discharged").length;
    const noAuth = items.filter((i) => String(i.fields.Auth ?? "").toLowerCase() === "none").length;
    return [
      { label: "Currently admitted", value: admitted, icon: BedDouble, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Pending", value: pending, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Discharged", value: discharged, icon: LogOut, accent: "from-slate-500/30 to-transparent", tone: "muted" },
      { label: "No-auth flagged", value: noAuth, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    ];
  },
  sectionKpis: (section, items) => {
    if (section.key === "movement") {
      return [
        { label: "Admitted", value: items.filter((i) => i.status === "admitted").length, icon: HeartPulse, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Transferred", value: items.filter((i) => i.status === "transferred").length, icon: ArrowRightLeft, accent: "from-sky-500/30 to-transparent" },
        { label: "Discharged", value: items.filter((i) => i.status === "discharged").length, icon: LogOut, accent: "from-slate-500/30 to-transparent", tone: "muted" },
        { label: "Cancelled", value: items.filter((i) => i.status === "cancelled").length, icon: Ban, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
      ];
    }
    if (section.key === "authorisation") {
      const noAuth = items.filter((i) => String(i.fields.Auth ?? "").toLowerCase() === "none").length;
      return [
        { label: "No-auth", value: noAuth, icon: ShieldOff, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
        { label: "Pending", value: items.filter((i) => i.status === "pending").length, icon: Clock, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Active", value: items.filter((i) => i.status === "admitted").length, icon: ShieldAlert, accent: "from-primary/30 to-transparent" },
      ];
    }
    if (section.key === "billing") {
      const finalised = items.filter((i) => String(i.fields["Bill Status"] ?? "") === "finalised").length;
      return [
        { label: "Bills open", value: items.length - finalised, icon: Receipt, accent: "from-amber-500/30 to-transparent", tone: "warning" },
        { label: "Finalised", value: finalised, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
        { label: "Statements", value: items.filter((i) => String(i.fields["Kind"] ?? "").includes("Statement")).length, icon: FileText, accent: "from-primary/30 to-transparent" },
      ];
    }
    return [
      { label: "Facilities", value: 8, icon: Building2, accent: "from-primary/30 to-transparent" },
      { label: "Beds", value: 1810, icon: BedDouble, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    ];
  },
  sections: [
    {
      key: "movement",
      title: "Patient Movement",
      tagline: "Admit · transfer · discharge",
      description: "Every touch-point in the patient journey — admission, ward moves, discharge, undischarge and neonate registration.",
      icon: BedDouble,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "admit", label: "Admit a Patient", icon: UserPlus, hint: "Capture a new admission", kind: "Admit", startStatus: "admitted",
          fields: [
            { name: "patient", label: "Patient name", required: true },
            { name: "mrn", label: "MRN", placeholder: "IMP-…" },
            { name: "facility", label: "Facility", required: true },
            { name: "ward", label: "Ward", required: true, placeholder: "e.g. Ward 3B" },
            { name: "bed", label: "Bed" },
            { name: "practitioner", label: "Admitting practitioner" },
          ]},
        { key: "view-admission", label: "View Admission", icon: Eye, hint: "Open admission details", kind: "View Admission", startStatus: "active",
          fields: [{ name: "reference", label: "Admission reference", required: true, placeholder: "ADM-…" }] },
        { key: "location", label: "Patient Location", icon: MapPin, hint: "Current ward and bed", kind: "Patient Location", startStatus: "active",
          fields: [{ name: "patient", label: "Patient", required: true }] },
        { key: "move-ward", label: "Move to Ward", icon: ArrowRightLeft, hint: "Internal ward transfer", kind: "Ward Move", startStatus: "transferred",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "fromWard", label: "From ward" },
            { name: "toWard", label: "To ward", required: true },
            { name: "reason", label: "Reason", type: "textarea" },
          ]},
        { key: "discharge", label: "Discharge Patient", icon: LogOut, hint: "Complete discharge", kind: "Discharge", startStatus: "discharged",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "destination", label: "Discharge destination", placeholder: "Home / Step-down / Transfer" },
            { name: "notes", label: "Clinical notes", type: "textarea" },
          ]},
        { key: "undischarge", label: "Undischarge EU Patient", icon: Undo2, hint: "Reverse a discharge (Emergency Unit)", kind: "Undischarge", startStatus: "admitted",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "register-birth", label: "Register Birth", icon: Baby, hint: "Add neonate to mother's admission", kind: "Register Birth", startStatus: "admitted",
          fields: [
            { name: "patient", label: "Mother", required: true },
            { name: "dob", label: "Date of birth", placeholder: "YYYY-MM-DD" },
            { name: "gender", label: "Gender" },
            { name: "weight", label: "Weight (g)", type: "number" },
          ]},
        { key: "cancel", label: "Cancel Admission", icon: Ban, hint: "Release the bed", kind: "Cancel Admission", startStatus: "cancelled",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "discontinue", label: "Discontinue Admission", icon: StopCircle, hint: "Stop in-progress admission", kind: "Discontinue", startStatus: "discontinued",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
    {
      key: "authorisation",
      title: "Authorisation & Location",
      tagline: "No-auth · location · admissions view",
      description: "Manage authorisation exceptions and quickly locate any inpatient in the network.",
      icon: ShieldAlert,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "no-auth", label: "Flag No-Auth", icon: ShieldOff, hint: "Mark admission as no authorisation", kind: "No Auth", startStatus: "pending",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "no-auth-admissions", label: "No Auth Admissions", icon: ShieldAlert, hint: "Board of open no-auth admissions", kind: "No Auth Board", startStatus: "active",
          fields: [{ name: "facility", label: "Facility" }] },
        { key: "patient-location", label: "Patient Location Lookup", icon: MapPin, hint: "Locate any inpatient", kind: "Location Lookup", startStatus: "active",
          fields: [{ name: "patient", label: "Patient", required: true }] },
      ],
    },
    {
      key: "billing",
      title: "Billing & Statements",
      tagline: "Finalise · invoices · checks",
      description: "Finalise bills, review invoices and manage billing checks against each admission.",
      icon: Wallet,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "finalise", label: "Finalise Bill", icon: Receipt, hint: "Close and total the bill", kind: "Finalise Bill", startStatus: "active",
          fields: [
            { name: "reference", label: "Admission reference", required: true },
            { name: "amount", label: "Total (R)", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "invoices", label: "Invoices & Statements", icon: FileText, hint: "View or reprint invoices", kind: "Invoice", startStatus: "active",
          fields: [
            { name: "reference", label: "Reference" },
            { name: "period", label: "Period", placeholder: "YYYY-MM" },
          ]},
        { key: "statement", label: "Statement of Account", icon: FileText, hint: "Full account statement", kind: "Statement", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient / Guarantor", required: true },
            { name: "period", label: "Period", placeholder: "YYYY-MM" },
          ]},
        { key: "billing-checks", label: "Manage Billing Checks", icon: ClipboardCheck, hint: "Configure and run billing checks", kind: "Billing Checks", startStatus: "active",
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
      description: "Facility-level occupancy, length of stay and no-auth board at a glance.",
      icon: ClipboardList,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "view-dashboard", label: "View Dashboard", icon: ClipboardList, hint: "Open the operational dashboard", kind: "Dashboard", startStatus: "active",
          fields: [
            { name: "facility", label: "Facility" },
            { name: "period", label: "Period", placeholder: "e.g. Week 27" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
