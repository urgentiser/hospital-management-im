import type { AppPrincipal, Permission } from "@/security/types";

export const Permissions = {
  DashboardView: "Dashboard.View",
  PatientView: "Patient.View",
  PatientCreate: "Patient.Create",
  PatientUpdate: "Patient.Update",
  TriageView: "Triage.View",
  PreadmissionView: "Preadmission.View",
  PreadmissionCreate: "Preadmission.Create",
  AssessmentView: "Assessment.View",
  AssessmentCreate: "Assessment.Create",
  AdmissionView: "Admission.View",
  AdmissionCreate: "Admission.Create",
  AdmissionUpdate: "Admission.Update",
  AdmissionTransfer: "Admission.Transfer",
  AdmissionDischarge: "Admission.Discharge",
  MedicalEventView: "MedicalEvent.View",
  DocumentView: "Document.View",
  DocumentManage: "Document.Manage",
  PharmacyView: "Pharmacy.View",
  PharmacyManage: "Pharmacy.Manage",
  TheatreView: "Theatre.View",
  TheatreManage: "Theatre.Manage",
  WardView: "Ward.View",
  WardManage: "Ward.Manage",
  CaseView: "Case.View",
  CaseManage: "Case.Manage",
  CodingView: "Coding.View",
  CodingManage: "Coding.Manage",
  AuthorisationView: "Authorisation.View",
  AuthorisationManage: "Authorisation.Manage",
  FundingView: "Funding.View",
  FundingManage: "Funding.Manage",
  BillingView: "Billing.View",
  BillingManage: "Billing.Manage",
  BillingFinalise: "Billing.Finalise",
  AccountingView: "Accounting.View",
  AccountingManage: "Accounting.Manage",
  CoidView: "COID.View",
  CoidManage: "COID.Manage",
  FacilityView: "Facility.View",
  FacilityManage: "Facility.Manage",
  FacilityOverride: "Facility.Override",
  PractitionerView: "Practitioner.View",
  PractitionerManage: "Practitioner.Manage",
  IntegrationView: "Integration.View",
  IntegrationRetry: "Integration.Retry",
  IntegrationReplay: "Integration.Replay",
  IntegrationIgnore: "Integration.Ignore",
  AuditView: "Audit.View",
  AuditExport: "Audit.Export",
  ReportView: "Report.View",
  AdministrationView: "Administration.View",
  AdministrationManage: "Administration.Manage",
  WorkflowView: "Workflow.View",
  NotificationView: "Notification.View",
  SystemHealthView: "SystemHealth.View",
  ExportData: "Data.Export",
  ConnectedPcms: "ConnectedApps.PCMS.Launch",
  ConnectedMultiTouchWard: "ConnectedApps.MultiTouchWard.Launch",
  ConnectedMultiTouchTheatre: "ConnectedApps.MultiTouchTheatre.Launch",
  ConnectedMultiTouchPharmacy: "ConnectedApps.MultiTouchPharmacy.Launch",
  ConnectedMultiTouchReception: "ConnectedApps.MultiTouchReception.Launch",
  ConnectedMultiTouchPatient: "ConnectedApps.MultiTouchPatient.Launch",
} as const satisfies Record<string, Permission>;

export const demoPermissions: Permission[] = ["*"];

export function hasPermission(principal: AppPrincipal | null | undefined, permission?: Permission): boolean {
  if (!permission) return true;
  if (!principal || principal.accountState !== "active") return false;
  const granted = principal.permissions;
  if (granted.includes("*")) return true;
  if (granted.includes(permission)) return true;
  const parts = permission.split(".");
  for (let index = parts.length - 1; index > 0; index -= 1) {
    const wildcard = `${parts.slice(0, index).join(".")}.*`;
    if (granted.includes(wildcard)) return true;
  }
  return false;
}

export function firstMissingPermission(
  principal: AppPrincipal | null | undefined,
  permissions: Permission[],
): Permission | null {
  return permissions.find((permission) => !hasPermission(principal, permission)) ?? null;
}
