import { createFileRoute } from "@tanstack/react-router";
import {
  HardHat, Send, ClipboardList, ShieldCheck, XCircle, Coins,
  FileText, Search, AlertTriangle,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";
import { makeDefaultWorklist } from "@/components/worklist";

const config: ModuleConsoleConfig = {
  moduleKey: "coid",
  patientScoped: true,
  eyebrow: "Statutory · COID",
  title: "COID",
  description: "Compensation for Occupational Injuries and Diseases — register cases, submit to the Compensation Commissioner and track through payment.",
  heroHeadline: "Every injury on duty, on one statutory desk.",
  heroBlurb: "Capture the incident, submit W.CL forms to the Commissioner, and reconcile the payment — with employer, patient and treating clinician in one view.",
  heroBadge: "Live · COID desk",
  heroCtas: [
    { label: "Register an IOD", sectionKey: "intake", primary: true },
    { label: "Submit to Commissioner", sectionKey: "submit" },
    { label: "Reconcile payment", sectionKey: "reconcile" },
  ],
  overviewKpis: (items) => [
    { label: "Open cases", value: items.filter((i) => ["intake", "submitted", "assessment"].includes(i.status)).length, icon: HardHat, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Approved", value: items.filter((i) => i.status === "approved").length, icon: ShieldCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
    { label: "Paid", value: items.filter((i) => i.status === "paid").length, icon: Coins, accent: "from-primary/30 to-transparent" },
    { label: "Rejected", value: items.filter((i) => i.status === "rejected").length, icon: XCircle, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
  ],
  sections: [
    {
      key: "intake",
      title: "IOD Intake",
      tagline: "Register · verify employer",
      description: "Register an Injury on Duty or occupational disease with employer and incident details.",
      icon: HardHat,
      accent: "from-primary/25 via-amber-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "register-iod", label: "Register IOD", icon: HardHat, hint: "Register an injury on duty", kind: "IOD", startStatus: "intake",
          fields: [
            { name: "patient", label: "Patient", required: true },
            { name: "employer", label: "Employer", required: true },
            { name: "incidentDate", label: "Incident date", placeholder: "YYYY-MM-DD" },
            { name: "injury", label: "Injury / condition", required: true },
            { name: "bodyPart", label: "Body part" },
            { name: "description", label: "Description", type: "textarea" },
          ]},
      ],
    },
    {
      key: "submit",
      title: "Commissioner Submission",
      tagline: "W.CL forms · pre-auth",
      description: "Compile and submit W.CL.1/2/4/5 forms to the Compensation Commissioner.",
      icon: Send,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "compile", label: "Compile W.CL Pack", icon: FileText, hint: "Assemble statutory pack", kind: "Compile", startStatus: "intake",
          fields: [{ name: "reference", label: "COID case ref", required: true }]},
        { key: "submit-coid", label: "Submit to Commissioner", icon: Send, hint: "Submit statutory pack", kind: "Submit", startStatus: "submitted",
          fields: [
            { name: "reference", label: "COID case ref", required: true },
            { name: "coidRef", label: "W.CL reference", placeholder: "W.CL-000000" },
          ]},
      ],
    },
    {
      key: "reconcile",
      title: "Assessment & Payment",
      tagline: "Track · reconcile",
      description: "Track Commissioner assessment, receive award and reconcile payment.",
      icon: Coins,
      accent: "from-amber-500/25 via-orange-500/15 to-transparent",
      ring: "ring-amber-400/30",
      actions: [
        { key: "record-award", label: "Record Award", icon: ClipboardList, hint: "Log Commissioner's award", kind: "Award", startStatus: "approved",
          fields: [
            { name: "reference", label: "COID case ref", required: true },
            { name: "awardAmount", label: "Award (R)", type: "number", required: true },
            { name: "notes", label: "Notes", type: "textarea" },
          ]},
        { key: "reconcile-payment", label: "Reconcile Payment", icon: Coins, hint: "Match payment to award", kind: "Payment", startStatus: "paid",
          fields: [
            { name: "reference", label: "COID case ref", required: true },
            { name: "amount", label: "Paid amount (R)", type: "number", required: true },
          ]},
        { key: "search", label: "Search COID", icon: Search, hint: "Filter COID cases", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true }] },
        { key: "dispute", label: "Dispute Rejection", icon: AlertTriangle, hint: "Lodge dispute at Commissioner", kind: "Dispute", startStatus: "submitted",
          fields: [
            { name: "reference", label: "COID case ref", required: true },
            { name: "grounds", label: "Grounds", required: true, type: "textarea" },
          ], destructive: true },
      ],
    },
  ],
  worklist: makeDefaultWorklist("coid", "COID"),

  businessFlow: {
    moduleKey: "coid",
    title: "COID Claim",
    purpose: "Register an occupational injury or disease, submit W.CL forms to the Commissioner, and track through award and payment.",
    legacySource: "Rich/Statutory/COID.Implet; coid.menu.xml",
    routeFamily: ["/coid", "/coid/new", "/coid/{id}", "/coid/{id}/pack", "/coid/{id}/dispute"],
    patientRequired: true,
    completionKind: "COID",
    completionStatus: "submitted",
    completionLabel: "COID case",
    titleFrom: (v) => `IOD · ${v.patient ?? "Patient"}`,
    subtitleFrom: (v) => [v.employer, v.injury].filter(Boolean).join(" · "),
    events: [
      "IODRegistered", "COIDPackCompiled", "COIDSubmitted",
      "COIDAssessed", "COIDAwarded", "COIDRejected", "COIDPaid", "COIDDisputed",
    ],
    handoffs: ["Employer notification", "Treating Practitioner", "Billing", "Case Management"],
    globalRules: [
      "IOD must be reported to the employer within 7 days.",
      "First medical report (W.CL.4) required within 14 days of first treatment.",
      "Progress reports required until Maximum Medical Improvement.",
      "COID pays a statutory tariff — schemes are not billed for accepted IOD.",
      "Every submission and response is audit-logged.",
    ],
    acceptance: [
      "Register an IOD, compile the W.CL pack and submit to the Commissioner.",
      "Record the Commissioner's award and reconcile the payment.",
      "Dispute a rejection with supporting evidence.",
    ],
    steps: [
      { key: "patient", title: "Patient & incident", description: "Capture the patient and incident essentials.",
        fields: [
          { name: "patient", label: "Injured worker", required: true },
          { name: "idNumber", label: "ID / passport" },
          { name: "incidentDate", label: "Incident date", required: true, placeholder: "YYYY-MM-DD" },
          { name: "incidentTime", label: "Incident time", placeholder: "HH:mm" },
          { name: "location", label: "Where did it happen?" },
        ] },
      { key: "employer", title: "Employer & workplace", description: "Capture employer details and CF reference number.",
        fields: [
          { name: "employer", label: "Employer", required: true },
          { name: "employerRef", label: "Employer CF number" },
          { name: "occupation", label: "Occupation" },
          { name: "workplace", label: "Workplace / department" },
        ] },
      { key: "injury", title: "Injury / disease detail", description: "Capture injury nature, body part and severity.",
        fields: [
          { name: "injury", label: "Injury / disease", required: true },
          { name: "bodyPart", label: "Body part" },
          { name: "mechanism", label: "Mechanism of injury", type: "textarea" },
          { name: "severity", label: "Severity", type: "select", options: ["First aid", "Minor", "Moderate", "Severe", "Fatal"] },
        ] },
      { key: "wcl1", title: "W.CL.1 · Employer's report", description: "Confirm the employer's first report of accident (W.CL.1) is on file.",
        checklist: ["Employer's W.CL.1 received", "Section 39 notice sent to employer", "Copy of ID / payslip attached"],
        rules: ["Employer must report within 7 days of the incident."] },
      { key: "wcl4", title: "W.CL.4 · First medical report", description: "First medical report by the treating practitioner.",
        fields: [
          { name: "practitioner", label: "Treating practitioner", required: true },
          { name: "diagnosis", label: "Diagnosis / ICD-10" },
          { name: "treatmentStart", label: "Treatment start", placeholder: "YYYY-MM-DD" },
        ],
        rules: ["W.CL.4 required within 14 days of first treatment."] },
      { key: "wcl5", title: "W.CL.5 · Progress report", description: "Add any progress reports up to Maximum Medical Improvement.",
        fields: [
          { name: "progress", label: "Latest progress note", type: "textarea" },
          { name: "mmi", label: "MMI reached?", type: "select", options: ["No", "Yes"] },
        ] },
      { key: "pack", title: "Compile statutory pack", description: "Compile the W.CL pack (1, 4, 5), ID, payslip and any specialist reports.",
        checklist: ["W.CL.1 attached", "W.CL.4 attached", "Progress reports attached", "ID + payslip attached", "Specialist reports attached (if any)"],
        events: ["COIDPackCompiled"] },
      { key: "submit", title: "Submit to Commissioner", description: "Submit via CompEasy portal or manual channel.",
        fields: [
          { name: "channel", label: "Channel", type: "select", options: ["CompEasy portal", "Manual · courier", "Employer-mediated"] },
          { name: "coidRef", label: "W.CL reference (if issued)" },
        ],
        events: ["COIDSubmitted"] },
      { key: "assess", title: "Commissioner assessment", description: "Track Commissioner assessment and award or rejection.",
        fields: [
          { name: "decision", label: "Decision", type: "select", options: ["Pending", "Accepted", "Rejected", "More info requested"] },
          { name: "awardAmount", label: "Award (R)", type: "number" },
        ],
        events: ["COIDAssessed", "COIDAwarded", "COIDRejected"] },
      { key: "dispute", title: "Dispute (if rejected)", description: "Lodge a Section 91 objection with supporting evidence.",
        fields: [
          { name: "grounds", label: "Grounds", type: "textarea" },
          { name: "newEvidence", label: "New evidence", type: "textarea" },
        ],
        events: ["COIDDisputed"] },
      { key: "payment", title: "Payment reconciliation", description: "Receive payment against the award and reconcile.",
        fields: [
          { name: "paidAmount", label: "Paid (R)", type: "number" },
          { name: "paidAt", label: "Paid on", placeholder: "YYYY-MM-DD" },
        ],
        events: ["COIDPaid"] },
    ],
  },
};

export const Route = createFileRoute("/_app/coid")({
  head: () => ({
    meta: [
      { title: "COID Claims — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
