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
  businessFlow: {
    moduleKey: "theatre",
    title: "Theatre Management",
    purpose: "Manage theatre procedures, registers, stock/equipment usage, preference cards, trolley preparation and theatre billing.",
    legacySource: "Rich/Theatre/Client; Channel/MultiTouch/Theatre; rich.theatreevent.menu.xml",
    routeFamily: ["/theatre", "/theatre/schedule", "/theatre/events/{id}", "/theatre/preference-cards", "/theatre/trolleys"],
    patientRequired: true,
    completionKind: "Theatre Procedure",
    completionStatus: "completed",
    completionLabel: "Theatre event",
    titleFrom: (v) => v.procedure || "Theatre procedure",
    subtitleFrom: (v) => [v.theatre, v.surgeon, v.patient].filter(Boolean).join(" · "),
    events: [
      "TheatreEventStarted", "TheatreProcedureCompleted", "TheatreRegisterCompleted",
      "TheatreBillApproved", "TheatreProcedureCancelled", "TrolleyPrepared",
      "TheatreProductReplaced",
    ],
    handoffs: ["Ward Management", "Billing", "Pharmacy", "Case Management"],
    globalRules: [
      "A theatre event must reference an admission or valid medical event.",
      "Theatre and practitioner conflicts must be warned.",
      "Completed registers are locked and amended only through controlled correction.",
      "Product substitution must retain the original request and replacement reference.",
      "Theatre bill approval must be separate from capture where segregation of duties applies.",
    ],
    acceptance: [
      "Complete a theatre event from schedule through register and charge approval.",
      "Prepare a trolley from a preference card and record shortages.",
      "Cancel a procedure and verify resource release and audit.",
    ],
    steps: [
      { key: "schedule", title: "Open theatre schedule / search visit", description: "Open the day's theatre schedule or search for the patient visit.",
        fields: [
          { name: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life The Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] },
          { name: "date", label: "Schedule date", placeholder: "YYYY-MM-DD" },
        ] },
      { key: "event", title: "Select planned or active theatre event", description: "Select the specific booking to work.",
        fields: [
          { name: "reference", label: "Booking reference", required: true, placeholder: "TH-…" },
          { name: "admissionRef", label: "Admission reference" },
        ],
        rules: ["Event must reference an admission or valid medical event."] },
      { key: "confirm", title: "Confirm patient, procedure, theatre, team, timing", description: "Verify the patient banner and confirm the planned procedure, theatre room and timing.",
        fields: [
          { name: "patient", label: "Patient", required: true },
          { name: "procedure", label: "Procedure", required: true },
          { name: "theatre", label: "Theatre room", required: true },
          { name: "start", label: "Start time", placeholder: "HH:mm" },
          { name: "duration", label: "Planned duration (min)", type: "number" },
        ],
        events: ["TheatreEventStarted"] },
      { key: "team", title: "Procedure classification and team", description: "Capture classification, surgeon, anaesthetist and nursing team.",
        fields: [
          { name: "classification", label: "Procedure classification", type: "select", options: ["Elective", "Emergency", "Day case", "Minor", "Major"] },
          { name: "surgeon", label: "Surgeon", required: true },
          { name: "anaesthetist", label: "Anaesthetist" },
          { name: "nursingTeam", label: "Nursing team", type: "textarea", placeholder: "Scrub, circulating, runner…" },
        ] },
      { key: "usage", title: "Capture stock, equipment, gases, non-consumables", description: "Record surgeon stock, anaesthetic stock, recovery stock, equipment, gases and non-consumables (PCMS lookup).",
        fields: [
          { name: "surgeonStock", label: "Surgeon stock", type: "textarea", placeholder: "One item per line — PCMS code · qty" },
          { name: "anaestheticStock", label: "Anaesthetic stock", type: "textarea" },
          { name: "recoveryStock", label: "Recovery stock", type: "textarea" },
          { name: "gasesUsed", label: "Gases used" },
          { name: "equipmentUsed", label: "Equipment / non-consumables" },
          { name: "substitution", label: "Substitution (original → replacement)" },
        ],
        events: ["TheatreProductReplaced"],
        rules: ["Product substitution must retain the original request and replacement reference."] },
      { key: "review", title: "Review procedure and usage summary", description: "Preview the full usage summary before completing the register.",
        checklist: [
          "All stock items captured with quantities",
          "Gases and equipment recorded",
          "Substitutions traced to original request",
        ] },
      { key: "register", title: "Complete theatre register", description: "Capture mandatory clinical and operational register fields and sign off.",
        fields: [
          { name: "incisionAt", label: "Incision time", placeholder: "HH:mm" },
          { name: "closureAt", label: "Closure time", placeholder: "HH:mm" },
          { name: "counts", label: "Swab / instrument counts", type: "select", options: ["Correct", "Discrepancy — see notes"] },
          { name: "registerNotes", label: "Register notes", type: "textarea" },
        ],
        events: ["TheatreRegisterCompleted", "TheatreProcedureCompleted"],
        rules: ["Completed registers are locked and only amendable through controlled correction."] },
      { key: "charges", title: "Generate and review charges", description: "Charges are derived from usage; review for missing items and variances.",
        fields: [
          { name: "chargeAmount", label: "Charge total (R)", type: "number" },
          { name: "chargeNotes", label: "Notes on variance", type: "textarea" },
        ] },
      { key: "approve", title: "Approve theatre bill or return", description: "Approve the theatre bill (segregation of duties) or return for correction.",
        fields: [{ name: "billDecision", label: "Decision", type: "select", required: true, options: ["Approve", "Return for correction"] }],
        events: ["TheatreBillApproved"],
        rules: ["Bill approval must be separate from capture where segregation of duties applies."] },
      { key: "publish", title: "Publish completed procedure and charge events", description: "Publish the completed procedure and charge events for downstream billing and reporting.",
        events: ["TheatreProcedureCompleted", "TheatreBillApproved"] },
      { key: "cancel", title: "Cancellation path — reason and release", description: "If cancelled, capture reason and release theatre, team and reserved stock.",
        fields: [
          { name: "cancelled", label: "Cancelled?", type: "select", options: ["No", "Yes"] },
          { name: "cancelReason", label: "Cancellation reason", type: "textarea" },
        ],
        events: ["TheatreProcedureCancelled"] },
    ],
  },
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
