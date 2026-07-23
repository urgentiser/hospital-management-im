/**
 * Patient Maintenance process catalogue.
 *
 * Only Register Patient, Update Contact Details and Print Past Documents are
 * primary operational actions. Search / View helpers are supporting cards.
 */
import type { LucideIcon } from "lucide-react";
import {
  UserPlus, Search, Users, IdCard, Eye, Printer, FileText, ShieldAlert,
} from "lucide-react";
import { Permissions } from "@/security/permissions";
import type { Permission } from "@/security/types";

export type PatientMaintenanceGroupKey = "registration" | "maintenance" | "documents";

export type PatientMaintenanceProcessDef = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: PatientMaintenanceGroupKey;
  permission: Permission;
  primary?: boolean;
  elevated?: boolean;
  destructive?: boolean;
};

export const patientMaintenanceGroups: Array<{
  key: PatientMaintenanceGroupKey;
  title: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: "registration", title: "Registration",  tagline: "Create, search and resolve possible duplicate patient records.", icon: Users,   accent: "from-primary/25 via-accent/15 to-transparent" },
  { key: "maintenance",  title: "Maintenance",   tagline: "Keep contact details, addresses and profile data current.",     icon: IdCard,  accent: "from-emerald-500/25 via-teal-500/15 to-transparent" },
  { key: "documents",    title: "Documents",     tagline: "Reprint historic documents and view the document history.",      icon: Printer, accent: "from-sky-500/25 via-primary/15 to-transparent" },
];

export const patientMaintenanceProcesses: PatientMaintenanceProcessDef[] = [
  // Registration
  { key: "register-patient",   label: "Register Patient",           description: "Register a new patient after resolving any possible duplicate matches.", icon: UserPlus,   group: "registration", permission: Permissions.PatientCreate, primary: true },
  { key: "search-patient",     label: "Search Patient",             description: "Search the patient index by name, MRN, SA ID/passport, DOB or contact details.", icon: Search,   group: "registration", permission: Permissions.PatientView },
  { key: "resolve-duplicate",  label: "Resolve Possible Duplicate", description: "Review probable matches and reuse an existing patient instead of creating a duplicate.", icon: ShieldAlert, group: "registration", permission: Permissions.PatientView, elevated: true },

  // Maintenance
  { key: "update-contact",     label: "Update Contact Details",     description: "Update phone, email, preferred channel and residential / postal address with an audit note.", icon: IdCard,   group: "maintenance",  permission: Permissions.PatientUpdate, primary: true },
  { key: "view-profile",       label: "View Patient Profile",       description: "Open the full patient profile with demographics, funding, consent, documents and timeline.", icon: Eye,      group: "maintenance",  permission: Permissions.PatientView },

  // Documents
  { key: "print-past-documents", label: "Print Past Documents",     description: "Preview and reprint historic documents such as discharge summaries, invoices and consents.", icon: Printer,  group: "documents",    permission: Permissions.DocumentView, primary: true },
  { key: "view-document-history",label: "View Document History",    description: "Browse every document linked to the patient with type, version and facility.", icon: FileText, group: "documents",    permission: Permissions.DocumentView },
];

export const patientMaintenanceProcessById = new Map(
  patientMaintenanceProcesses.map((p) => [p.key, p] as const),
);
