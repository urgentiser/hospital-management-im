import { hasPermission, Permissions } from "@/security/permissions";
import type { AppPrincipal, Permission } from "@/security/types";

const routePermissions: Array<[string, Permission]> = [
  ["/admin", Permissions.AdministrationView],
  ["/service-bus", Permissions.IntegrationView],
  ["/failed-messages", Permissions.IntegrationView],
  ["/integrations", Permissions.IntegrationView],
  ["/audit", Permissions.AuditView],
  ["/system-health", Permissions.SystemHealthView],
  ["/reports", Permissions.ReportView],
  ["/patients", Permissions.PatientView],
  ["/triage", Permissions.TriageView],
  ["/preadmissions", Permissions.PreadmissionView],
  ["/member-validation", Permissions.AuthorisationView],
  ["/clinical-assessments", Permissions.AssessmentView],
  ["/admissions", Permissions.AdmissionView],
  ["/medical-events", Permissions.MedicalEventView],
  ["/documents", Permissions.DocumentView],
  ["/pharmacy", Permissions.PharmacyView],
  ["/theatre", Permissions.TheatreView],
  ["/ward", Permissions.WardView],
  ["/case-management", Permissions.CaseView],
  ["/clinical-coding", Permissions.CodingView],
  ["/authorisations", Permissions.AuthorisationView],
  ["/funding", Permissions.FundingView],
  ["/billing", Permissions.BillingView],
  ["/payments", Permissions.AccountingView],
  ["/claims", Permissions.BillingView],
  ["/accounting", Permissions.AccountingView],
  ["/reimbursements", Permissions.AccountingView],
  ["/supplier-invoices", Permissions.AccountingView],
  ["/account-enquiries", Permissions.AccountingView],
  ["/adhoc", Permissions.BillingView],
  ["/services", Permissions.IntegrationView],
  ["/mylife-portal", Permissions.WorkflowView],
  ["/coid", Permissions.CoidView],
  ["/facilities", Permissions.FacilityView],
  ["/practitioners", Permissions.PractitionerView],
  ["/workflow-inbox", Permissions.WorkflowView],
  ["/notifications", Permissions.NotificationView],
];

export function getRequiredPermissionForPath(pathname: string): Permission | undefined {
  return routePermissions.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
}

export function canAccessRoute(principal: AppPrincipal | null | undefined, pathname: string): boolean {
  return hasPermission(principal, getRequiredPermissionForPath(pathname));
}
