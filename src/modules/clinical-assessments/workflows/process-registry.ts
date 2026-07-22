/**
 * Clinical Assessment process catalogue.
 */
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList, Eye, Search, PlayCircle, Link2, UserCog, Save, FileText,
  ClipboardCheck, CheckCircle2, Undo2, Printer, History,
} from "lucide-react";
import { Permissions } from "@/security/permissions";
import type { Permission } from "@/security/types";

export type ClinicalAssessmentProcessGroupKey =
  | "capture" | "review" | "completion";

export type ClinicalAssessmentProcessDef = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: ClinicalAssessmentProcessGroupKey;
  permission: Permission;
  destructive?: boolean;
  elevated?: boolean;
  primary?: boolean;
};

export const clinicalAssessmentProcessGroups: Array<{
  key: ClinicalAssessmentProcessGroupKey;
  title: string; tagline: string; icon: LucideIcon; accent: string;
}> = [
  { key: "capture",    title: "Assessment capture",    tagline: "Start, resume and structure clinical assessments.", icon: ClipboardList, accent: "from-emerald-500/25 via-teal-500/15 to-transparent" },
  { key: "review",     title: "Assessment review",     tagline: "Search, view and inspect clinical assessments.",    icon: Eye,           accent: "from-primary/25 via-accent/15 to-transparent" },
  { key: "completion", title: "Assessment completion", tagline: "Validate, complete and correct the clinical record.", icon: ClipboardCheck, accent: "from-fuchsia-500/25 via-violet-500/15 to-transparent" },
];

export const clinicalAssessmentProcesses: ClinicalAssessmentProcessDef[] = [
  // Capture
  { key: "assess-patient",       label: "Assess patient",              description: "Full guided clinical assessment covering facility, patient, context, vitals, urinalysis, acuity and coding.", icon: PlayCircle,   group: "capture",    permission: Permissions.AssessmentCreate, primary: true },
  { key: "continue-assessment",  label: "Continue assessment",         description: "Resume a Draft or In-progress assessment where it was left off.",                                             icon: ClipboardList,group: "capture",    permission: Permissions.AssessmentCreate },
  { key: "link-preadmission",    label: "Link or replace preadmission",description: "Attach or replace the preadmission linked to the current assessment.",                                       icon: Link2,        group: "capture",    permission: Permissions.AssessmentCreate },
  { key: "replace-patient",      label: "Replace patient",             description: "Replace the patient the assessment is captured against — with reason and audit note.",                       icon: UserCog,      group: "capture",    permission: Permissions.AssessmentCreate, elevated: true },
  { key: "save-draft-exit",      label: "Save draft and exit",         description: "Persist the current capture as a Draft and exit the guided workflow.",                                       icon: Save,         group: "capture",    permission: Permissions.AssessmentCreate },

  // Review
  { key: "view-assessment",      label: "View assessment",             description: "Search assessments by date, number or patient and open the full clinical record.",                          icon: Eye,          group: "review",     permission: Permissions.AssessmentView, primary: true },
  { key: "search-assessments",   label: "Search assessments",          description: "Advanced search across facilities, states, dates and patient identifiers.",                                  icon: Search,       group: "review",     permission: Permissions.AssessmentView },
  { key: "view-clinical-record", label: "View clinical record",        description: "Open the composite clinical record for the currently selected patient.",                                    icon: FileText,     group: "review",     permission: Permissions.AssessmentView },
  { key: "assessment-history",   label: "Assessment history",          description: "Timeline and state history of previous assessments for a patient.",                                         icon: History,      group: "review",     permission: Permissions.AssessmentView },

  // Completion
  { key: "validate-assessment",  label: "Validate assessment",         description: "Run blocking and warning validations across all sections of an assessment.",                                icon: ClipboardCheck, group: "completion", permission: Permissions.AssessmentCreate },
  { key: "complete-assessment",  label: "Complete assessment",         description: "Mark a validated assessment as completed and generate the clinical record.",                                icon: CheckCircle2, group: "completion", permission: Permissions.AssessmentCreate },
  { key: "correct-reopen",       label: "Correct / reopen assessment", description: "Reopen a completed assessment for correction — requires permission, reason and confirmation.",              icon: Undo2,        group: "completion", permission: Permissions.AssessmentCreate, elevated: true },
  { key: "print-clinical-record",label: "Print clinical record",       description: "Generate a print-preview of the clinical record or admission and discharge record.",                        icon: Printer,      group: "completion", permission: Permissions.AssessmentView },
];

export const clinicalAssessmentProcessById = new Map(
  clinicalAssessmentProcesses.map((p) => [p.key, p] as const),
);
