export const ROLES = [
  "Administrator",
  "Clinical User",
  "Operational User",
  "Support User",
  "Reporting User",
  "Read-only User",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  "Administrator": "Full platform access including user, facility and system configuration.",
  "Clinical User": "Clinical workflows: patients, admissions, medical events, pharmacy, theatre, ward.",
  "Operational User": "Front-office and back-office operations: billing, funding, documents, case management.",
  "Support User": "Read-most access plus retry/ignore on integrations and diagnostics.",
  "Reporting User": "Reports, BI and read-only access to worklists.",
  "Read-only User": "View-only across the platform. No mutating actions.",
};

export const ROLE_COLOR: Record<Role, string> = {
  "Administrator": "bg-primary/15 text-primary border-primary/30",
  "Clinical User": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "Operational User": "bg-sky-500/15 text-sky-500 border-sky-500/30",
  "Support User": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "Reporting User": "bg-violet-500/15 text-violet-500 border-violet-500/30",
  "Read-only User": "bg-muted text-muted-foreground border-border",
};
