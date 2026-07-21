import { createFileRoute } from "@tanstack/react-router";
import {
  UserPlus, Printer, PhoneCall, IdCard, Search, Users,
  FileText, UserCheck, ShieldAlert,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "patients",
  patientScoped: true,
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
  businessFlow: {
    moduleKey: "patients",
    title: "Patient Maintenance",
    purpose: "Create and maintain the authoritative patient identity and demographic record used throughout the Impilo patient journey.",
    legacySource: "Rich/Patient/Client.Implet; rich.patient.menu.xml",
    routeFamily: ["/patients", "/patients/new", "/patients/{id}", "/patients/{id}/documents", "/patients/{id}/timeline"],
    patientRequired: true,
    completionKind: "Register Patient",
    completionStatus: "active",
    completionLabel: "Patient registration",
    titleFrom: (v) => v.patient || v.name || "New patient",
    subtitleFrom: (v) => [v.mrn, v.scheme, v.facility].filter(Boolean).join(" · "),
    events: [
      "PatientCreated", "PatientUpdated", "PatientContactChanged",
      "PatientConsentCaptured", "PatientDocumentLinked",
    ],
    handoffs: ["Preadmission", "Admissions", "Documents", "Authorisations"],
    globalRules: [
      "Duplicate search must run before patient creation.",
      "Required identifiers depend on country, age and patient type.",
      "Editable fields are scoped by permission and facility.",
      "Allergies and clinical warnings are visible but not editable from demographics unless authorised.",
      "Every create, merge, update and document access must be audited.",
      "Identity merges require elevated permission, reason and a reversible admin process.",
    ],
    acceptance: [
      "Search and open an existing patient without exposing patients outside the active facility scope.",
      "Register a new patient after resolving duplicate matches.",
      "Update permitted contact details and verify before/after values in the audit timeline.",
    ],
    steps: [
      { key: "facility", title: "Select facility context", description: "Choose the active hospital or facility. Search scope is limited to this facility.",
        fields: [{ name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] }],
        rules: ["User must have access to the selected facility."] },
      { key: "search", title: "Search for existing person", description: "Look up by national ID, passport, MRN, name, DOB or contact details.",
        fields: [
          { name: "idNumber", label: "National ID / Passport", placeholder: "e.g. 8506010001081" },
          { name: "mrn", label: "MRN", placeholder: "IMP-…" },
          { name: "name", label: "Name (surname, first name)" },
          { name: "dob", label: "Date of birth", placeholder: "YYYY-MM-DD" },
          { name: "phone", label: "Phone" },
        ],
        rules: ["Duplicate search is mandatory before creation."] },
      { key: "duplicates", title: "Review duplicate matches", description: "Review exact and probable matches. An explicit decision is required before continuing.",
        checklist: [
          "Reviewed all exact-match candidates",
          "Reviewed probable matches (name + DOB / phone)",
          "Confirmed no duplicate exists, OR selected an existing person",
        ] },
      { key: "decision", title: "Select existing or create new", description: "Confirm whether to reuse an existing record or create a net-new patient identity.",
        fields: [
          { name: "decision", label: "Decision", type: "select", required: true, options: ["Create new patient", "Reuse existing person"] },
          { name: "existingId", label: "Existing patient ID (if reuse)" },
        ] },
      { key: "demographics", title: "Capture demographics", description: "Capture core identifiers, addresses and communication details.",
        fields: [
          { name: "patient", label: "Full name (surname, first name)", required: true },
          { name: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Other", "Unknown"] },
          { name: "address", label: "Residential address", type: "textarea" },
          { name: "email", label: "Email" },
          { name: "language", label: "Preferred language" },
        ] },
      { key: "contacts", title: "Next of kin, employer, GP", description: "Capture next of kin, employer, family practitioner and preferred communication channel.",
        fields: [
          { name: "nextOfKin", label: "Next of kin (name · relation · phone)" },
          { name: "employer", label: "Employer" },
          { name: "gp", label: "Family practitioner" },
          { name: "prefContact", label: "Preferred contact channel", type: "select", options: ["Phone", "SMS", "Email", "WhatsApp"] },
        ] },
      { key: "consent", title: "Consent, privacy and signature", description: "Capture privacy acknowledgement, treatment consent and digital signature where required.",
        checklist: [
          "POPIA / privacy notice acknowledged",
          "General treatment consent captured",
          "Digital signature captured (where required)",
        ],
        events: ["PatientConsentCaptured"],
        rules: ["Consent capture is a required audit event."] },
      { key: "funding", title: "Funding and guarantor", description: "Link the patient to a medical scheme, plan and guarantor.",
        fields: [
          { name: "scheme", label: "Scheme", type: "select", options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Private / cash"] },
          { name: "plan", label: "Plan / option" },
          { name: "membership", label: "Membership number" },
          { name: "guarantor", label: "Guarantor (if not the patient)" },
        ] },
      { key: "documents", title: "Review documents and images", description: "Upload / link any ID document, medical aid card and prior clinical documentation.",
        checklist: ["ID document captured", "Medical aid card captured", "Any prior clinical documents linked"],
        events: ["PatientDocumentLinked"] },
      { key: "validate", title: "Validate mandatory and duplicate rules", description: "The system re-runs mandatory and duplicate checks before you can confirm.",
        checklist: ["All mandatory fields captured", "Duplicate resolution decision recorded", "Facility scope respected"] },
      { key: "confirm", title: "Confirm and save", description: "Confirm the record. On save the patient identifier is issued and the record becomes available across every module.",
        fields: [{ name: "confirm", label: "Confirmation note", type: "textarea", placeholder: "Any additional notes on this registration" }] },
    ],
  },
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
