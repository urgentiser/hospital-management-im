import { createFileRoute } from "@tanstack/react-router";
import {
  Code2, FileSignature, ListChecks, Search, ShieldAlert, PenLine,
  Sparkles, RotateCcw, Database, MessageCircleQuestion,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "clinical-coding",
  patientScoped: true,
  eyebrow: "Clinical Operations · Clinical Coding",
  title: "Clinical Coding",
  description: "Assign ICD-10, CPT and NHRPL codes to episodes of care. Coder review queues, audit and re-coding under sign-off.",
  heroHeadline: "Clean codes in — clean claims out.",
  heroBlurb: "Auto-suggest, coder review, sign-off and audit — the coding step between clinical events and billing.",
  heroBadge: "Live · Coder desk",
  heroCtas: [
    { label: "Code an episode", sectionKey: "coding", primary: true },
    { label: "Open coder queue", sectionKey: "queue" },
    { label: "Recode under audit", sectionKey: "audit" },
  ],
  overviewKpis: (items) => {
    const review = items.filter((i) => i.status === "in-review").length;
    const signed = items.filter((i) => i.status === "signed").length;
    const flagged = items.filter((i) => i.status === "flagged").length;
    return [
      { label: "Codes in flight", value: items.length, icon: Code2, accent: "from-primary/30 to-transparent" },
      { label: "In review", value: review, icon: ListChecks, accent: "from-amber-500/30 to-transparent", tone: "warning" },
      { label: "Signed", value: signed, icon: FileSignature, accent: "from-emerald-500/30 to-transparent", tone: "success" },
      { label: "Flagged", value: flagged, icon: ShieldAlert, accent: "from-rose-500/30 to-transparent", tone: "destructive" },
    ];
  },
  sections: [
    {
      key: "coding",
      title: "Coding Desk",
      tagline: "Auto-suggest · assign",
      description: "Open an episode, review clinical events and assign the ICD-10, CPT and NHRPL codes.",
      icon: PenLine,
      accent: "from-primary/25 via-indigo-500/15 to-transparent",
      ring: "ring-primary/30",
      actions: [
        { key: "code-episode", label: "Code Episode", icon: Code2, hint: "Assign codes to an episode", kind: "Code Episode", startStatus: "in-review",
          fields: [
            { name: "episode", label: "Episode / Case ref", required: true },
            { name: "patient", label: "Patient", required: true },
            { name: "icd10", label: "ICD-10 code(s)" },
            { name: "cpt", label: "CPT / procedure code(s)" },
            { name: "nhrpl", label: "NHRPL codes" },
          ]},
        { key: "auto-suggest", label: "Auto-suggest", icon: Sparkles, hint: "Run auto-suggest against events", kind: "Auto-suggest", startStatus: "in-review",
          fields: [
            { name: "episode", label: "Episode / Case ref", required: true },
          ]},
      ],
    },
    {
      key: "queue",
      title: "Coder Queue",
      tagline: "Filter · assign · sign",
      description: "The queue of episodes awaiting coding, with per-coder assignment and sign-off.",
      icon: ListChecks,
      accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-400/30",
      actions: [
        { key: "search", label: "Search Queue", icon: Search, hint: "Filter the coder queue", kind: "Search", startStatus: "active",
          fields: [{ name: "query", label: "Search", required: true, placeholder: "Episode / patient / coder" }]},
        { key: "sign", label: "Sign-off", icon: FileSignature, hint: "Countersign a completed coding record", kind: "Sign", startStatus: "signed",
          fields: [
            { name: "reference", label: "Coding ref", required: true },
            { name: "signer", label: "Countersigner", required: true },
          ]},
      ],
    },
    {
      key: "audit",
      title: "Audit & Recode",
      tagline: "Flag · recode",
      description: "Flag suspicious codes for audit, recode with a reason, or reject a code and return the episode to the coder.",
      icon: ShieldAlert,
      accent: "from-rose-500/25 via-pink-500/15 to-transparent",
      ring: "ring-rose-400/30",
      actions: [
        { key: "flag", label: "Flag for Audit", icon: ShieldAlert, hint: "Route to coding audit", kind: "Flag", startStatus: "flagged",
          fields: [
            { name: "reference", label: "Coding ref", required: true },
            { name: "reason", label: "Reason", required: true, type: "textarea" },
          ], destructive: true },
        { key: "coding-query", label: "Coding Query", icon: MessageCircleQuestion, hint: "Raise a clarification question to the clinician", kind: "Coding Query", startStatus: "in-review",
          fields: [
            { name: "reference", label: "Coding ref", required: true },
            { name: "clinician", label: "Clinician", required: true },
            { name: "question", label: "Question", required: true, type: "textarea" },
          ]},
        { key: "recode", label: "Recode", icon: RotateCcw, hint: "Recode under audit (requires reopen if bill finalised)", kind: "Recode", startStatus: "in-review",
          fields: [
            { name: "reference", label: "Coding ref", required: true },
            { name: "newCodes", label: "New codes", required: true },
            { name: "billFinalised", label: "Bill already finalised? (yes/no)", placeholder: "no" },
            { name: "reopenAuthorisedBy", label: "Reopen authorised by (if bill finalised)" },
            { name: "reason", label: "Reason for recode", required: true, type: "textarea" },
          ]},
      ],
    },
    {
      key: "reference",
      title: "Reference Data",
      tagline: "ICD · CPT · NHRPL",
      description: "Maintain the coding reference sets used by the coder desk — subsets, crossmaps and predictables.",
      icon: Database,
      accent: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
      ring: "ring-violet-400/30",
      actions: [
        { key: "maintain-icd", label: "Maintain ICD Subset", icon: Database, hint: "Curate the ICD-10 subset used by coders", kind: "ICD Subset", startStatus: "active",
          fields: [
            { name: "code", label: "ICD-10 code", required: true, placeholder: "e.g. K80.20" },
            { name: "description", label: "Description", required: true },
            { name: "category", label: "Category" },
          ]},
        { key: "maintain-cpt", label: "Maintain CPT Subset / Crossmap", icon: Database, hint: "CPT subset and CPT↔NHRPL crossmap", kind: "CPT Subset", startStatus: "active",
          fields: [
            { name: "cpt", label: "CPT code", required: true, placeholder: "e.g. 47562" },
            { name: "nhrpl", label: "NHRPL crossmap" },
            { name: "description", label: "Description" },
          ]},
        { key: "maintain-nhrpl", label: "Maintain SADANRPL", icon: Database, hint: "Local NHRPL / SADANRPL tariff codes", kind: "SADANRPL", startStatus: "active",
          fields: [
            { name: "code", label: "SADANRPL code", required: true },
            { name: "description", label: "Description", required: true },
          ]},
        { key: "maintain-predictables", label: "Maintain Predictables", icon: Sparkles, hint: "Predictable code sets used by auto-suggest", kind: "Predictables", startStatus: "active",
          fields: [
            { name: "scenario", label: "Clinical scenario", required: true },
            { name: "codes", label: "Suggested codes", required: true, type: "textarea" },
          ]},
        { key: "maintain-lists", label: "Maintain Coding Lists", icon: ListChecks, hint: "Coder work lists and queue definitions", kind: "Coding List", startStatus: "active",
          fields: [
            { name: "list", label: "List name", required: true },
            { name: "scope", label: "Scope", placeholder: "Facility / Coder / Payer" },
          ]},
      ],
    },
  ],
  businessFlow: {
    moduleKey: "clinical-coding",
    title: "Clinical Coding",
    purpose: "Assign clinically accurate ICD-10, CPT and NHRPL codes to an episode of care so downstream funding, billing and reporting are correct.",
    legacySource: "Rich/Coding/Coder.Implet; coding.menu.xml",
    routeFamily: ["/clinical-coding", "/clinical-coding/{episodeId}", "/clinical-coding/{episodeId}/sign", "/clinical-coding/audit"],
    patientRequired: true,
    completionKind: "Coded Episode",
    completionStatus: "signed",
    completionLabel: "Clinical coding",
    titleFrom: (v) => `Coded · ${v.patient ?? "Patient"} · ${v.episode ?? ""}`.trim(),
    subtitleFrom: (v) => [v.icd10, v.cpt].filter(Boolean).join(" · "),
    events: [
      "EpisodeReadyForCoding", "CodesSuggested", "CodesAssigned",
      "CodingSigned", "CodingFlaggedForAudit", "CodingRecoded",
    ],
    handoffs: ["Billing", "Funding", "Case Management", "Reports"],
    globalRules: [
      "Coders must be credentialled for the code system used (ICD-10 / CPT / NHRPL).",
      "Auto-suggested codes are advisory — coder must accept or override.",
      "Every code assignment stores rationale linked to a clinical event.",
      "Recode requires a documented reason and a countersign.",
      "Coded outputs are the only inputs allowed into claim generation.",
    ],
    acceptance: [
      "Open an episode, run auto-suggest, and accept a subset of codes.",
      "Sign-off a coded episode and observe it appear ready for billing.",
      "Recode an episode with reason; audit trail shows before and after.",
    ],
    steps: [
      { key: "episode", title: "Select episode", description: "Pick the episode/case ready for coding.",
        fields: [
          { name: "episode", label: "Episode / Case ref", required: true },
          { name: "patient", label: "Patient", required: true },
          { name: "facility", label: "Facility" },
        ]},
      { key: "review", title: "Review clinical events", description: "Read the episode timeline — admission, procedures, medications and discharge.",
        checklist: ["Admission diagnosis reviewed", "All procedures reviewed", "Medications and adverse events reviewed", "Discharge summary reviewed"],
        events: ["EpisodeReadyForCoding"] },
      { key: "suggest", title: "Run auto-suggest", description: "Let the coding engine suggest ICD-10, CPT and NHRPL codes from the events.",
        events: ["CodesSuggested"] },
      { key: "icd10", title: "Assign ICD-10 diagnoses", description: "Assign the principal diagnosis and any secondary diagnoses.",
        fields: [
          { name: "principal", label: "Principal diagnosis (ICD-10)", required: true, placeholder: "e.g. K80.20" },
          { name: "icd10", label: "Secondary diagnoses (comma-separated)" },
        ] },
      { key: "cpt", title: "Assign CPT procedures", description: "Assign the CPT / procedure codes performed during the episode.",
        fields: [{ name: "cpt", label: "CPT codes", placeholder: "e.g. 47562, 99223" }] },
      { key: "nhrpl", title: "Assign NHRPL tariff codes", description: "Assign NHRPL tariff codes for scheme reimbursement.",
        fields: [{ name: "nhrpl", label: "NHRPL codes" }] },
      { key: "validate", title: "Validate coding rules", description: "Run coder validation: unbundling, mutually-exclusive combinations, laterality and PMB alignment.",
        checklist: ["No unbundling violations", "No mutually-exclusive conflicts", "Laterality captured where required", "PMB alignment checked"] },
      { key: "notes", title: "Coder notes", description: "Add rationale and any queries for the treating clinician.",
        fields: [{ name: "notes", label: "Coder notes", type: "textarea" }] },
      { key: "sign", title: "Sign-off", description: "Sign the coded episode. Signed codes are the only ones allowed into claims.",
        fields: [{ name: "signer", label: "Coder / Countersigner", required: true }],
        events: ["CodesAssigned", "CodingSigned"] },
      { key: "publish", title: "Publish and hand off", description: "Publish CodingSigned to the service bus and hand off to Billing and Funding.",
        events: ["CodingSigned"] },
    ],
  },
};

export const Route = createFileRoute("/_app/clinical-coding")({
  head: () => ({
    meta: [
      { title: "Clinical Coding — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
