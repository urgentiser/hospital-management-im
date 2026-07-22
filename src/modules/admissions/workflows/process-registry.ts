/**
 * Admissions process catalogue.
 *
 * Groups and processes follow the Admissions operating model. Group ordering
 * and the placement of every process is enforced here — the Process Selector
 * derives its groupings, counts and permission gates from this file only.
 */
import type { LucideIcon } from "lucide-react";
import {
  UserPlus, Repeat, PhoneCall, Ambulance, ShieldOff, Eye, MapPin, ArrowRightLeft,
  BedDouble, UserCog, Baby, ShieldAlert, Wallet, Receipt, ClipboardCheck, Coins,
  LogOut, Undo2, Ban, StopCircle, Pencil, FileText, ClipboardList, Search,
  CreditCard, XCircle, Users, HeartCrack, FlaskConical, LayoutDashboard, FileSpreadsheet,
} from "lucide-react";
import { Permissions } from "@/security/permissions";
import type { Permission } from "@/security/types";

export type AdmissionProcessGroupKey =
  | "creation"
  | "identification"
  | "management"
  | "funding"
  | "financial"
  | "departure"
  | "corrections"
  | "monitoring";

export type AdmissionProcessDef = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: AdmissionProcessGroupKey;
  /** Section key in the ModuleConsole config (used by legacy dispatch). */
  sectionKey: string;
  /** Action key inside the section (used by legacy dispatch). */
  actionKey: string;
  /** Fine-grained permission required to launch this process. */
  permission: Permission;
  /** Elevated / destructive actions surface a badge and require reason. */
  destructive?: boolean;
  elevated?: boolean;
};

export const admissionProcessGroups: Array<{
  key: AdmissionProcessGroupKey;
  title: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: "creation",       title: "Admission creation",         tagline: "Start a new inpatient episode.",                icon: UserPlus,        accent: "from-emerald-500/25 via-teal-500/15 to-transparent" },
  { key: "identification", title: "Identification & location",  tagline: "Find, locate and open existing admissions.",    icon: Eye,             accent: "from-primary/25 via-accent/15 to-transparent" },
  { key: "management",     title: "Admission management",       tagline: "Bed, ward, practitioner and neonate care.",     icon: BedDouble,       accent: "from-sky-500/25 via-cyan-500/15 to-transparent" },
  { key: "funding",        title: "Funding & authorisation",    tagline: "Medical aid, authorisations and rejections.",   icon: ShieldAlert,     accent: "from-amber-500/25 via-orange-500/15 to-transparent" },
  { key: "financial",      title: "Financial & billing",        tagline: "Charges, discharge bill and financial handoff.", icon: Wallet,         accent: "from-fuchsia-500/25 via-violet-500/15 to-transparent" },
  { key: "departure",      title: "Departure",                  tagline: "Pre-discharge review and discharge.",            icon: LogOut,         accent: "from-slate-500/25 via-zinc-500/15 to-transparent" },
  { key: "corrections",    title: "Corrections & exceptions",   tagline: "Cancel, discontinue, undischarge and amend.",    icon: Undo2,          accent: "from-rose-500/25 via-pink-500/15 to-transparent" },
  { key: "monitoring",     title: "Operational monitoring",     tagline: "Live dashboards and operational board views.",   icon: LayoutDashboard, accent: "from-indigo-500/25 via-blue-500/15 to-transparent" },
];

export const admissionProcesses: AdmissionProcessDef[] = [
  // 1 — Admission creation
  { key: "admit",              label: "Admit a patient",              description: "Full guided admission covering facility, patient, funding, authorisation, consent and bed allocation.", icon: UserPlus,   group: "creation",       sectionKey: "movement", actionKey: "admit",              permission: Permissions.AdmissionCreate },
  { key: "convert-pre",        label: "Convert preadmission",         description: "Promote a ready preadmission into an active admission without re-capturing verified information.",     icon: Repeat,     group: "creation",       sectionKey: "movement", actionKey: "admit",              permission: Permissions.AdmissionCreate },
  { key: "direct-admit",       label: "Direct admission",             description: "Admit without a preadmission (walk-in or scheduled direct admission).",                                icon: PhoneCall,  group: "creation",       sectionKey: "movement", actionKey: "admit",              permission: Permissions.AdmissionCreate },
  { key: "emergency-admit",    label: "Emergency / A&E admission",    description: "Convert an active Emergency Unit visit into an inpatient admission with temporary identity support.",  icon: Ambulance,  group: "creation",       sectionKey: "movement", actionKey: "admit",              permission: Permissions.AdmissionCreate },
  { key: "no-auth-admit",      label: "No-authorisation admission",   description: "Admit and flag as no-auth with reason, follow-up owner and management approval where required.",      icon: ShieldOff,  group: "creation",       sectionKey: "authorisation", actionKey: "no-auth",      permission: Permissions.AdmissionCreate, elevated: true },

  // 2 — Identification & location
  { key: "view-admission",     label: "View admission",               description: "Open the complete admission detail workspace with backend-driven available actions.",                 icon: Eye,        group: "identification", sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.AdmissionView },
  { key: "patient-location",   label: "Patient location",             description: "Locate any inpatient across the network with real-time ward, room and bed information.",             icon: MapPin,     group: "identification", sectionKey: "authorisation", actionKey: "patient-location", permission: Permissions.AdmissionView },

  // 3 — Admission management
  { key: "allocate-bed",       label: "Allocate ward and bed",        description: "Select ward, room and bed with live availability and start accommodation history.",                    icon: BedDouble,  group: "management",     sectionKey: "movement", actionKey: "admit",              permission: Permissions.AdmissionUpdate },
  { key: "move-ward",          label: "Move to ward",                 description: "Internal transfer with previous-location guard, reason and continuous accommodation history.",         icon: ArrowRightLeft, group: "management", sectionKey: "movement", actionKey: "move-ward",         permission: Permissions.AdmissionTransfer },
  { key: "change-practitioner",label: "Change practitioner",          description: "Change admitting, responsible or referring practitioner with sanction and effective-date validation.", icon: UserCog,    group: "management",     sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.AdmissionUpdate },
  { key: "register-birth",     label: "Register birth",               description: "Register a neonate against the mother's admission with baby MRN and neonatal allocation.",             icon: Baby,       group: "management",     sectionKey: "movement", actionKey: "register-birth",     permission: Permissions.AdmissionUpdate },

  // 4 — Funding & authorisation
  { key: "medical-aid",        label: "Medical aid details",          description: "Capture and view scheme, plan, membership, dependant, benefits and member-validation result.",         icon: CreditCard, group: "funding",        sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.FundingView },
  { key: "capture-auth",       label: "Capture authorisation",        description: "Record or link an authorisation for an active admission, including approved stay and treatment.",     icon: ShieldAlert, group: "funding",       sectionKey: "authorisation", actionKey: "no-auth",       permission: Permissions.AuthorisationManage },
  { key: "auth-enquiry",       label: "Authorisation search",         description: "Look up authorisations across facilities, schemes and members.",                                     icon: Search,     group: "funding",        sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AuthorisationView },
  { key: "funding-change",     label: "Change funding",               description: "Change funding method, scheme, plan or guarantor on an active admission.",                             icon: Wallet,     group: "funding",        sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.FundingManage },
  { key: "no-auth-board",      label: "No-authorisation admissions",  description: "Live worklist of no-authorisation admissions requiring follow-up.",                                   icon: ShieldOff,  group: "funding",        sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AuthorisationView },
  { key: "rejected-hospital",  label: "Rejected authorisations — hospital", description: "Rejected authorisations scoped to the current facility with assignment and resubmission.",     icon: XCircle,    group: "funding",        sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AuthorisationView },
  { key: "rejected-group",     label: "Rejected authorisations — group",    description: "Rejected authorisations across all authorised facilities (group permission required).",         icon: Users,      group: "funding",        sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AuthorisationManage },
  { key: "past-coid",          label: "Past COID admissions",         description: "Historical COID admissions with employer, incident, claim and outcome context.",                    icon: FileSpreadsheet, group: "funding",   sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AdmissionView },
  { key: "past-injury",        label: "Past injury admissions",       description: "Historical injury admissions with date, type, admission and outcome context.",                      icon: HeartCrack, group: "funding",        sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AdmissionView },
  { key: "past-poisoning",     label: "Past poisoning admissions",    description: "Historical poisoning admissions with substance, admission and outcome context.",                    icon: FlaskConical, group: "funding",      sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: Permissions.AdmissionView },

  // 5 — Financial & billing
  { key: "misc-charge",        label: "Add miscellaneous charge",     description: "Capture a bill-side miscellaneous charge on an active admission.",                                   icon: Receipt,    group: "financial",      sectionKey: "billing", actionKey: "view-admission",      permission: Permissions.BillingManage },
  { key: "billing-checks",     label: "Manage billing checks",        description: "Work outstanding billing and clinical checks before bill finalisation.",                             icon: ClipboardCheck, group: "financial",  sectionKey: "billing", actionKey: "view-admission",      permission: Permissions.BillingManage },
  { key: "finalise-bill",      label: "Finalise bill",                description: "Close accommodation and finalise the discharge bill with authoritative totals.",                     icon: Coins,      group: "financial",      sectionKey: "billing", actionKey: "view-admission",      permission: Permissions.BillingManage },
  { key: "invoices-statements",label: "Invoices and statements",      description: "Generate, download, print, reprint or email patient, guarantor, funder and provincial documents.",   icon: FileText,   group: "financial",      sectionKey: "billing", actionKey: "view-admission",      permission: Permissions.BillingView },
  { key: "statement-of-account", label: "Statement of account",       description: "Full statement of account with charges, adjustments, payments and outstanding balance.",             icon: FileSpreadsheet, group: "financial", sectionKey: "billing", actionKey: "view-admission",     permission: Permissions.BillingView },

  // 6 — Departure
  { key: "predischarge",       label: "Pre-discharge review",         description: "Live pre-discharge review pulling readiness from Ward, Theatre, Pharmacy, Coding, Case and Billing.", icon: ClipboardList, group: "departure",   sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.AdmissionUpdate },
  { key: "discharge",          label: "Discharge patient",            description: "Complete discharge with disposition, destination, clinical summary and dependent-module handoffs.",  icon: LogOut,     group: "departure",      sectionKey: "movement", actionKey: "discharge",          permission: Permissions.AdmissionDischarge },

  // 7 — Corrections & exceptions
  { key: "cancel-admission",   label: "Cancel admission",             description: "Cancel a pending or active admission with reason and elevated approval.",                             icon: Ban,        group: "corrections",    sectionKey: "movement", actionKey: "cancel",             permission: Permissions.AdmissionUpdate, destructive: true, elevated: true },
  { key: "discontinue",        label: "Discontinue admission",        description: "Stop an in-progress admission before completion with reason and elevated approval.",                 icon: StopCircle, group: "corrections",    sectionKey: "movement", actionKey: "discontinue",        permission: Permissions.AdmissionUpdate, destructive: true, elevated: true },
  { key: "undischarge",        label: "Undischarge EU patient",       description: "Reverse a discharge for an eligible Emergency Unit patient with elevated approval.",                icon: Undo2,      group: "corrections",    sectionKey: "movement", actionKey: "undischarge",        permission: Permissions.AdmissionUpdate, destructive: true, elevated: true },
  { key: "amend-admission",    label: "Amend admission",              description: "Correct captured admission details with full audit trail and elevated approval.",                    icon: Pencil,     group: "corrections",    sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.AdmissionUpdate, elevated: true },
  { key: "notes-documents",    label: "Notes and documents",          description: "Add clinical or administrative notes and attach supporting documents to the admission.",             icon: FileText,   group: "corrections",    sectionKey: "movement", actionKey: "view-admission",     permission: Permissions.AdmissionUpdate },

  // 8 — Operational monitoring
  { key: "dashboard",          label: "Admissions dashboard",         description: "Operational dashboard with occupancy, length of stay, no-auth board and discharge pipeline.",         icon: LayoutDashboard, group: "monitoring", sectionKey: "dashboard", actionKey: "view-dashboard",   permission: Permissions.AdmissionView },
];

export const admissionProcessById = new Map(admissionProcesses.map((p) => [p.key, p] as const));

export const admissionProcessCounts = () => {
  const byGroup = admissionProcessGroups.map((g) => ({
    key: g.key,
    count: admissionProcesses.filter((p) => p.group === g.key).length,
  }));
  return { total: admissionProcesses.length, byGroup };
};
