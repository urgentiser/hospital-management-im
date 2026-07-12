import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus, Printer, PhoneCall, IdCard, Search, Users,
  FileText, UserCheck, ShieldAlert,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "patients",
  eyebrow: "Front Office · Patient Maintenance",
  title: "Patient Maintenance",
  description: "Register patients, keep demographics and contact details current and reprint prior documents.",
  heroHeadline: "One place to keep every patient record clean, current and complete.",
  heroBlurb: "Register new patients, update contact details and reprint historic documents — with a scoped feed of every change.",
  heroBadge: "Live · Patient index",
  heroCtas: [
    { label: "Register a patient", sectionKey: "registration", primary: true },
    { label: "Update contact details", sectionKey: "maintenance" },
    { label: "Print past documents", sectionKey: "documents" },
  ],
  overviewKpis: (items) => {
    const active = items.filter((i) => i.status === "active").length;
    const pending = items.filter((i) => i.status === "pending" || i.status === "invited").length;
    return [
      { label: "Patients on file", value: items.length, icon: Users, accent: "from-primary/30 to-transparent" },
      { label: "Active", value: active, icon: UserCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Pending verification", value: pending, icon: ShieldAlert, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Documents on file", value: items.length * 3, icon: FileText, accent: "from-sky-500/30 to-transparent" },
    ];
  },
  sections: [
    {
      key: "registration",
      title: "Registration",
      tagline: "Create · verify",
      description: "Register a new patient and capture core demographic and scheme data.",
      icon: UserPlus,
      accent: "from-primary/25 via-accent/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "register-patient", label: "Register Patient", icon: UserPlus, hint: "Create a new patient record", kind: "Register Patient", startStatus: "active",
          fields: [
            { name: "patient", label: "Full name", required: true },
            { name: "idNumber", label: "ID / Passport", required: true },
            { name: "dob", label: "Date of birth", placeholder: "YYYY-MM-DD" },
            { name: "gender", label: "Gender" },
            { name: "scheme", label: "Scheme" },
            { name: "facility", label: "Facility" },
          ]},
        { key: "search-patient", label: "Search Patient", icon: Search, hint: "Find a patient record", kind: "Search Patient", startStatus: "active",
          fields: [
            { name: "query", label: "Search term", required: true, placeholder: "Name / ID / MRN" },
          ]},
      ],
    },
    {
      key: "maintenance",
      title: "Maintenance",
      tagline: "Demographics · contacts",
      description: "Keep patient contact details and identity data current.",
      icon: IdCard,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "update-contact-details", label: "Update Contact Details", icon: PhoneCall, hint: "Change phone, email or address", kind: "Update Contact Details", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "phone", label: "Phone" },
            { name: "email", label: "Email" },
            { name: "address", label: "Address", type: "textarea" },
          ]},
        { key: "update-identity", label: "Update Identity", icon: IdCard, hint: "Correct ID / scheme details", kind: "Update Identity", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "idNumber", label: "ID / Passport" },
            { name: "scheme", label: "Scheme" },
            { name: "membership", label: "Membership no." },
          ]},
      ],
    },
    {
      key: "documents",
      title: "Documents",
      tagline: "Reprint · reissue",
      description: "Reprint historic documents (discharge summaries, consent forms, invoices).",
      icon: Printer,
      accent: "from-sky-500/25 via-primary/15 to-transparent",
      ring: "ring-sky-400/30",
      actions: [
        { key: "print-past-documents", label: "Print Past Documents", icon: Printer, hint: "Reprint any historic document", kind: "Print Past Documents", startStatus: "active",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "documents", label: "Documents", placeholder: "e.g. Discharge summary, Consent" },
            { name: "period", label: "Period", placeholder: "YYYY-MM" },
          ]},
      ],
    },
  ],
};

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [
      { title: "Patient Maintenance — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
