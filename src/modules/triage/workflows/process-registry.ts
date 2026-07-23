/**
 * Triage process catalogue — matches the two extracted primary processes.
 */
import type { LucideIcon } from "lucide-react";
import { ListChecks, Stethoscope } from "lucide-react";
import { Permissions } from "@/security/permissions";
import type { Permission } from "@/security/types";

export type TriageProcessGroupKey = "capture" | "attend";

export type TriageProcessDef = {
  key: "triage-patient" | "triage-list";
  label: string;
  description: string;
  icon: LucideIcon;
  group: TriageProcessGroupKey;
  permission: Permission;
  primary?: boolean;
};

export const triageProcessGroups: Array<{
  key: TriageProcessGroupKey;
  title: string; tagline: string; icon: LucideIcon; accent: string;
}> = [
  { key: "capture", title: "Triage capture", tagline: "Register an arrival, record observations and calculate severity.", icon: Stethoscope, accent: "from-rose-500/25 via-orange-500/15 to-transparent" },
  { key: "attend",  title: "Triage attendance", tagline: "Open the facility triage list and attend an existing patient.", icon: ListChecks,  accent: "from-primary/25 via-accent/15 to-transparent" },
];

export const triageProcesses: TriageProcessDef[] = [
  {
    key: "triage-patient",
    label: "Triage Patient",
    description: "Confirm hospital unit, identify the patient, record observations, calculate severity and save the triage record.",
    icon: Stethoscope,
    group: "capture",
    permission: Permissions.TriageCreate,
    primary: true,
  },
  {
    key: "triage-list",
    label: "Triage List",
    description: "Open the facility-scoped triage list to attend, reassess or complete an existing triage record.",
    icon: ListChecks,
    group: "attend",
    permission: Permissions.TriageView,
    primary: true,
  },
];

export const triageProcessById = new Map(triageProcesses.map((p) => [p.key, p] as const));
