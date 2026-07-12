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
  businessFlow: {
    moduleKey: "ward",
    title: "Ward Management",
    purpose: "Manage patient occupancy, accommodation, ward treatments, nursing cards, specialists and ward documents.",
    legacySource: "Rich/Ward/Client; Rich/WardManagement/Client.Implet; Channel/MultiTouch/Ward",
    routeFamily: ["/wards", "/wards/occupancy", "/wards/{wardId}", "/ward-treatments", "/nursing-cards"],
    patientRequired: true,
    completionKind: "Ward Treatment",
    completionStatus: "posted",
    completionLabel: "Ward treatment",
    titleFrom: (v) => v.treatment || "Ward treatment",
    subtitleFrom: (v) => [v.patient, v.ward, v.bed && `Bed ${v.bed}`].filter(Boolean).join(" · "),
    events: [
      "WardTreatmentCaptured", "WardTreatmentCredited", "AccommodationChanged",
      "AccommodationCorrected", "AdditionalSpecialistAssigned", "WardDocumentGenerated",
    ],
    handoffs: ["Billing", "Admissions", "Documents", "Pharmacy"],
    globalRules: [
      "Only active and authorised wards / beds may be used.",
      "Treatment timestamps must fall within the active admission unless correction permission applies.",
      "Credits must reference the original charge.",
      "PCMS supplies product master data; Impilo records clinical use and billing references only.",
      "Accommodation corrections must preserve the original entry and recalculate occupancy and charges.",
    ],
    acceptance: [
      "Capture and bill a ward treatment using a PCMS product reference.",
      "Correct an accommodation entry and verify occupancy recalculation.",
      "Credit a prior treatment with traceability to the original charge.",
    ],
    steps: [
      { key: "occupancy", title: "Open hospital occupancy", description: "Open the occupancy board scoped to the active facility.",
        fields: [{ name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] }] },
      { key: "ward", title: "Select ward and view beds", description: "Choose a ward and inspect beds, patients, restrictions and cleaning status.",
        fields: [
          { name: "ward", label: "Ward", required: true, placeholder: "e.g. Ward 3B" },
          { name: "wardType", label: "Ward type", type: "select", options: ["General", "HDU", "ICU", "Paediatric", "Maternity", "Neonatal", "Isolation"] },
        ] },
      { key: "patient", title: "Open patient ward context", description: "Select the patient in this ward and load the persistent patient banner.",
        fields: [
          { name: "patient", label: "Patient", required: true },
          { name: "bed", label: "Bed" },
          { name: "mrn", label: "MRN" },
        ] },
      { key: "capture", title: "Capture treatments, products, equipment, fees, gases", description: "Record what was delivered, using PCMS references for products.",
        fields: [
          { name: "treatment", label: "Treatment / procedure", required: true },
          { name: "product", label: "PCMS product / code" },
          { name: "quantity", label: "Quantity", type: "number" },
          { name: "gases", label: "Gases (litres / minutes)" },
          { name: "equipment", label: "Equipment" },
          { name: "capturedAt", label: "Captured at", placeholder: "YYYY-MM-DD HH:mm" },
        ],
        rules: ["Timestamp must fall inside the active admission."] },
      { key: "confirm", title: "Review and confirm ward charges", description: "Review the derived charges before releasing them to billing.",
        checklist: [
          "Products and quantities correct",
          "Fees match tariff",
          "Timestamps within admission window",
        ] },
      { key: "send", title: "Send charges to Billing", description: "Publish the ward-treatment event; billing consumes and posts against the admission.",
        events: ["WardTreatmentCaptured"] },
      { key: "correct-target", title: "Corrections — select original entry", description: "If a correction is needed, open the original treatment or accommodation entry.",
        fields: [
          { name: "correctionType", label: "Correction type", type: "select", options: ["None", "Treatment correction", "Accommodation correction", "Credit / reversal"] },
          { name: "originalRef", label: "Original entry reference" },
        ] },
      { key: "correct-values", title: "Adjustment reason and corrected values", description: "Capture the reason for correction and the corrected values.",
        fields: [
          { name: "correctedValues", label: "Corrected values", type: "textarea" },
          { name: "correctionReason", label: "Reason", type: "textarea", required: true },
        ],
        rules: ["Corrections preserve the original entry."] },
      { key: "recalc", title: "Recalculate occupancy or financial impact", description: "The system recalculates occupancy or financial impact and shows a preview.",
        checklist: [
          "Occupancy recalculated",
          "Financial impact previewed",
          "Downstream billing impact acknowledged",
        ] },
      { key: "confirm-correction", title: "Confirm and audit correction", description: "Confirm the correction; the original entry and the correction remain fully audited.",
        events: ["WardTreatmentCredited", "AccommodationCorrected"] },
      { key: "documents", title: "Print ward documents or maintain specialists", description: "Print required ward documents or assign additional specialists to the case.",
        fields: [
          { name: "documents", label: "Documents to print", placeholder: "Wristband, chart, consent…" },
          { name: "additionalSpecialist", label: "Additional specialist (if any)" },
        ],
        events: ["WardDocumentGenerated", "AdditionalSpecialistAssigned"] },
    ],
  },
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
