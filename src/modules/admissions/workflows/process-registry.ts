/**
 * Grouped registry of the 20+ guided processes defined in the Admissions
 * upgrade spec §4. Each entry references an existing action key in the
 * Admissions `ModuleConsole` config so the Process Selector can dispatch
 * straight into the guided workflow without duplicating step definitions.
 *
 * `permission` names align with `src/security/module-permissions.ts` module
 * permissions ("view", "manage", "elevated").
 */
import type { LucideIcon } from "lucide-react";
import {
  UserPlus, Repeat, PhoneCall, Ambulance, ShieldOff, Eye, MapPin, ArrowRightLeft,
  BedDouble, UserCog, Baby, ShieldAlert, Wallet, Receipt, ClipboardCheck, Coins,
  LogOut, Undo2, Ban, StopCircle, Pencil, FileText, Clock, ClipboardList, HeartPulse,
} from "lucide-react";

export type AdmissionProcessGroupKey =
  | "creation" | "identification" | "management" | "funding"
  | "financial" | "departure" | "corrections";

export type AdmissionProcessDef = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: AdmissionProcessGroupKey;
  /** Section key in the ModuleConsole config to route to. */
  sectionKey: string;
  /** Action key inside the section. */
  actionKey: string;
  permission?: "view" | "manage" | "elevated";
  destructive?: boolean;
};

export const admissionProcessGroups: Array<{
  key: AdmissionProcessGroupKey;
  title: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: "creation",       title: "Admission creation",         tagline: "Start a new inpatient episode.",             icon: UserPlus,     accent: "from-emerald-500/25 via-teal-500/15 to-transparent" },
  { key: "identification", title: "Identification & location",  tagline: "Find, locate and open existing admissions.", icon: Eye,          accent: "from-primary/25 via-accent/15 to-transparent" },
  { key: "management",     title: "Admission management",       tagline: "Bed, ward, practitioner and neonate care.",  icon: BedDouble,    accent: "from-sky-500/25 via-cyan-500/15 to-transparent" },
  { key: "funding",        title: "Funding & authorisation",    tagline: "Manage no-auth and authorisation exceptions.", icon: ShieldAlert, accent: "from-amber-500/25 via-orange-500/15 to-transparent" },
  { key: "financial",      title: "Financial & billing",        tagline: "Charges, discharge bill and account close.", icon: Wallet,       accent: "from-fuchsia-500/25 via-violet-500/15 to-transparent" },
  { key: "departure",      title: "Departure",                  tagline: "Discharge and post-discharge follow-through.", icon: LogOut,     accent: "from-slate-500/25 via-zinc-500/15 to-transparent" },
  { key: "corrections",    title: "Corrections & exceptions",   tagline: "Cancel, discontinue, undischarge and amend.", icon: Undo2,       accent: "from-rose-500/25 via-pink-500/15 to-transparent" },
];

export const admissionProcesses: AdmissionProcessDef[] = [
  // Creation
  { key: "admit",              label: "Admit a patient",              description: "Full guided admission for a scheduled or preadmitted patient.", icon: UserPlus,   group: "creation",       sectionKey: "movement", actionKey: "admit", permission: "manage" },
  { key: "convert-pre",        label: "Convert preadmission",         description: "Promote a ready preadmission into an active admission.",       icon: Repeat,     group: "creation",       sectionKey: "movement", actionKey: "admit", permission: "manage" },
  { key: "direct-admit",       label: "Direct admission",             description: "Admit without a preadmission (walk-in or scheduled direct).",  icon: PhoneCall,  group: "creation",       sectionKey: "movement", actionKey: "admit", permission: "manage" },
  { key: "emergency-admit",    label: "Emergency admission",          description: "Admit from the Emergency Unit, allowing temporary identity.",  icon: Ambulance,  group: "creation",       sectionKey: "movement", actionKey: "admit", permission: "manage" },
  { key: "no-auth-admit",      label: "No-authorisation admission",   description: "Admit and flag as no-auth, capturing follow-up ownership.",    icon: ShieldOff,  group: "creation",       sectionKey: "authorisation", actionKey: "no-auth", permission: "elevated" },

  // Identification & location
  { key: "view-admission",     label: "View admission",               description: "Open the full admission detail workspace.",                   icon: Eye,        group: "identification", sectionKey: "movement", actionKey: "view-admission", permission: "view" },
  { key: "patient-location",   label: "Patient location",             description: "Locate any inpatient across the facility network.",           icon: MapPin,     group: "identification", sectionKey: "authorisation", actionKey: "patient-location", permission: "view" },
  { key: "no-auth-board",      label: "No-auth admissions board",     description: "Live board of no-authorisation admissions requiring follow-up.", icon: ShieldAlert, group: "identification", sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: "view" },

  // Management
  { key: "allocate-bed",       label: "Allocate ward and bed",        description: "Assign or change ward and bed with accommodation history.",   icon: BedDouble,  group: "management",     sectionKey: "movement", actionKey: "admit", permission: "manage" },
  { key: "move-ward",          label: "Move to ward",                 description: "Internal transfer with reason and accommodation continuity.", icon: ArrowRightLeft, group: "management", sectionKey: "movement", actionKey: "move-ward", permission: "manage" },
  { key: "change-practitioner",label: "Change practitioner",          description: "Change admitting, responsible or referring practitioner.",    icon: UserCog,    group: "management",     sectionKey: "movement", actionKey: "view-admission", permission: "manage" },
  { key: "register-birth",     label: "Register birth",               description: "Register a neonate against the mother's admission.",          icon: Baby,       group: "management",     sectionKey: "movement", actionKey: "register-birth", permission: "manage" },

  // Funding
  { key: "capture-auth",       label: "Capture authorisation",        description: "Record or link an authorisation for an active admission.",     icon: ShieldAlert, group: "funding",       sectionKey: "authorisation", actionKey: "no-auth", permission: "manage" },
  { key: "funding-change",     label: "Change funding",               description: "Update funding method, scheme or guarantor details.",         icon: Wallet,     group: "funding",        sectionKey: "movement", actionKey: "view-admission", permission: "manage" },
  { key: "auth-enquiry",       label: "Authorisation enquiry",        description: "Look up authorisations across facilities and schemes.",       icon: ClipboardList, group: "funding",    sectionKey: "authorisation", actionKey: "no-auth-admissions", permission: "view" },

  // Financial
  { key: "misc-charge",        label: "Add miscellaneous charge",     description: "Capture a bill-side miscellaneous charge on the admission.",  icon: Receipt,    group: "financial",      sectionKey: "billing", actionKey: "view-admission", permission: "manage" },
  { key: "billing-checks",     label: "Manage billing checks",        description: "Work outstanding billing / clinical checks before finalise.", icon: ClipboardCheck, group: "financial",  sectionKey: "billing", actionKey: "view-admission", permission: "manage" },
  { key: "finalise-bill",      label: "Finalise bill",                description: "Close accommodation and finalise the discharge bill.",        icon: Coins,      group: "financial",      sectionKey: "billing", actionKey: "view-admission", permission: "manage" },

  // Departure
  { key: "discharge",          label: "Discharge patient",            description: "Complete discharge with disposition, checks and documents.",  icon: LogOut,     group: "departure",      sectionKey: "movement", actionKey: "discharge", permission: "manage" },
  { key: "predischarge",       label: "Pre-discharge review",         description: "Review outstanding clinical, billing and case tasks.",       icon: ClipboardList, group: "departure",   sectionKey: "movement", actionKey: "view-admission", permission: "manage" },

  // Corrections
  { key: "undischarge",        label: "Undischarge (EU)",             description: "Reverse a discharge for an EU patient with elevated approval.", icon: Undo2,     group: "corrections",   sectionKey: "movement", actionKey: "undischarge", destructive: true, permission: "elevated" },
  { key: "cancel-admission",   label: "Cancel admission",             description: "Cancel a pending or active admission with reason.",           icon: Ban,        group: "corrections",    sectionKey: "movement", actionKey: "cancel", destructive: true, permission: "elevated" },
  { key: "discontinue",        label: "Discontinue admission",        description: "Stop an in-progress admission before completion.",            icon: StopCircle, group: "corrections",    sectionKey: "movement", actionKey: "discontinue", destructive: true, permission: "elevated" },
  { key: "amend-admission",    label: "Amend admission",              description: "Correct captured admission details with audit trail.",        icon: Pencil,     group: "corrections",    sectionKey: "movement", actionKey: "view-admission", permission: "elevated" },
  { key: "notes-documents",    label: "Notes and documents",          description: "Add notes or attach supporting documents to the admission.",  icon: FileText,   group: "corrections",    sectionKey: "movement", actionKey: "view-admission", permission: "manage" },
];

export const admissionProcessById = new Map(admissionProcesses.map((p) => [p.key, p] as const));

/** Utility for KPI ribbons and empty states. */
export const admissionProcessCounts = () => ({
  total: admissionProcesses.length,
  creation: admissionProcesses.filter((p) => p.group === "creation").length,
  corrections: admissionProcesses.filter((p) => p.group === "corrections").length,
  clinical: admissionProcesses.filter((p) => p.group === "management").length,
});

// Silence unused-icon warning while keeping HeartPulse/Clock available for future groups.
export const _reservedIcons = { HeartPulse, Clock };
