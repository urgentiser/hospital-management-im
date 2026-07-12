import type { Role } from "./roles";

/**
 * Permission model: `<module>:<action>` → allowed roles.
 * Every entry MUST include a reason string, shown to the user when denied.
 */
export type Permission =
  | "patients:view" | "patients:create" | "patients:edit" | "patients:merge"
  | "admissions:view" | "admissions:create" | "admissions:allocate-bed" | "admissions:transfer" | "admissions:discharge" | "admissions:cancel" | "admissions:link-auth"
  | "medical-events:view" | "medical-events:create"
  | "authorisations:view" | "authorisations:submit" | "authorisations:override"
  | "pharmacy:view" | "pharmacy:dispense"
  | "theatre:view" | "theatre:book"
  | "ward:view" | "ward:handover"
  | "billing:view" | "billing:capture-payment" | "billing:refund" | "billing:reverse" | "billing:reconcile"
  | "documents:view" | "documents:upload" | "documents:archive" | "documents:download"
  | "reports:view" | "reports:export" | "reports:save-view"
  | "integrations:view" | "integrations:retry" | "integrations:ignore" | "integrations:download-error"
  | "admin:view" | "admin:manage-users" | "admin:manage-facilities" | "admin:manage-system"
  | "audit:view"
  | "my-work:view"
  | "notifications:view"
  | "system-health:view"
  | "failed-messages:view" | "failed-messages:retry" | "failed-messages:purge"
  | "pcms:launch";

interface PermRule {
  roles: Role[];
  reason: string;
}

const R = {
  all: ["Administrator", "Clinical User", "Operational User", "Support User", "Reporting User", "Read-only User"] as Role[],
  admin: ["Administrator"] as Role[],
  clinical: ["Administrator", "Clinical User"] as Role[],
  ops: ["Administrator", "Operational User"] as Role[],
  clinicalOps: ["Administrator", "Clinical User", "Operational User"] as Role[],
  support: ["Administrator", "Support User"] as Role[],
  reporting: ["Administrator", "Reporting User", "Operational User", "Clinical User"] as Role[],
  mutators: ["Administrator", "Clinical User", "Operational User"] as Role[],
};

const DENY_READONLY = "Your role is read-only. Ask an administrator to assign a role with edit rights.";
const DENY_CLINICAL = "This action is limited to Clinical or Administrator roles.";
const DENY_OPS = "This action is limited to Operational or Administrator roles.";
const DENY_ADMIN = "This action is limited to Administrators.";
const DENY_SUPPORT = "This action is limited to Support or Administrator roles.";

export const PERMISSIONS: Record<Permission, PermRule> = {
  "patients:view": { roles: R.all, reason: "You need at least read access to patients." },
  "patients:create": { roles: R.clinicalOps, reason: DENY_CLINICAL },
  "patients:edit": { roles: R.clinicalOps, reason: DENY_READONLY },
  "patients:merge": { roles: R.admin, reason: DENY_ADMIN },

  "admissions:view": { roles: R.all, reason: "You need admissions read access." },
  "admissions:create": { roles: R.clinicalOps, reason: DENY_CLINICAL },
  "admissions:allocate-bed": { roles: R.clinicalOps, reason: DENY_CLINICAL },
  "admissions:transfer": { roles: R.clinical, reason: DENY_CLINICAL },
  "admissions:discharge": { roles: R.clinical, reason: DENY_CLINICAL },
  "admissions:cancel": { roles: R.clinicalOps, reason: DENY_OPS },
  "admissions:link-auth": { roles: R.clinicalOps, reason: DENY_OPS },

  "medical-events:view": { roles: R.all, reason: "You need clinical read access." },
  "medical-events:create": { roles: R.clinical, reason: DENY_CLINICAL },

  "authorisations:view": { roles: R.all, reason: "Read access required." },
  "authorisations:submit": { roles: R.clinicalOps, reason: DENY_OPS },
  "authorisations:override": { roles: R.admin, reason: DENY_ADMIN },

  "pharmacy:view": { roles: R.all, reason: "Read access required." },
  "pharmacy:dispense": { roles: R.clinical, reason: DENY_CLINICAL },

  "theatre:view": { roles: R.all, reason: "Read access required." },
  "theatre:book": { roles: R.clinicalOps, reason: DENY_CLINICAL },

  "ward:view": { roles: R.all, reason: "Read access required." },
  "ward:handover": { roles: R.clinical, reason: DENY_CLINICAL },

  "billing:view": { roles: R.all, reason: "Read access required." },
  "billing:capture-payment": { roles: R.ops, reason: DENY_OPS },
  "billing:refund": { roles: R.ops, reason: DENY_OPS },
  "billing:reverse": { roles: R.admin, reason: "Reversals require an Administrator." },
  "billing:reconcile": { roles: R.ops, reason: DENY_OPS },

  "documents:view": { roles: R.all, reason: "Read access required." },
  "documents:upload": { roles: R.mutators, reason: DENY_READONLY },
  "documents:archive": { roles: R.ops, reason: DENY_OPS },
  "documents:download": { roles: R.all, reason: "Read access required." },

  "reports:view": { roles: R.reporting, reason: "Reporting role required." },
  "reports:export": { roles: R.reporting, reason: "Reporting role required to export." },
  "reports:save-view": { roles: R.reporting, reason: "Reporting role required to save views." },

  "integrations:view": { roles: ["Administrator", "Support User", "Operational User"], reason: "Support, Operational or Admin required." },
  "integrations:retry": { roles: R.support, reason: DENY_SUPPORT },
  "integrations:ignore": { roles: R.admin, reason: "Ignoring a message is Administrator-only." },
  "integrations:download-error": { roles: R.support, reason: DENY_SUPPORT },

  "admin:view": { roles: R.admin, reason: DENY_ADMIN },
  "admin:manage-users": { roles: R.admin, reason: DENY_ADMIN },
  "admin:manage-facilities": { roles: R.admin, reason: DENY_ADMIN },
  "admin:manage-system": { roles: R.admin, reason: DENY_ADMIN },

  "audit:view": { roles: ["Administrator", "Support User"], reason: "Audit log access is limited." },

  "my-work:view": { roles: R.all, reason: "Sign in required." },
  "notifications:view": { roles: R.all, reason: "Sign in required." },
  "system-health:view": { roles: ["Administrator", "Support User"], reason: DENY_SUPPORT },
  "failed-messages:view": { roles: ["Administrator", "Support User"], reason: DENY_SUPPORT },
  "failed-messages:retry": { roles: R.support, reason: DENY_SUPPORT },
  "failed-messages:purge": { roles: R.admin, reason: DENY_ADMIN },

  "pcms:launch": { roles: R.all, reason: "Sign in required." },
};

export function can(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission]?.roles.includes(role) ?? false;
}

export function reasonFor(permission: Permission): string {
  return PERMISSIONS[permission]?.reason ?? "You do not have permission to perform this action.";
}
