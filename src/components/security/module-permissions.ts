import type { ModuleKey } from "@/lib/workflow-store";
import { Permissions } from "@/security/permissions";
import type { Permission } from "@/security/types";

export type DefaultModulePermissions = {
  view?: Permission;
  create?: Permission;
  manage?: Permission;
  export?: Permission;
  note?: Permission;
};

const mapping: Record<ModuleKey, DefaultModulePermissions> = {
  patients: { view: Permissions.PatientView, create: Permissions.PatientCreate, manage: Permissions.PatientUpdate, note: Permissions.PatientUpdate },
  triage: { view: Permissions.TriageView, create: Permissions.AssessmentCreate, manage: Permissions.AssessmentCreate },
  preadmissions: { view: Permissions.PreadmissionView, create: Permissions.PreadmissionCreate, manage: Permissions.PreadmissionCreate },
  "clinical-assessments": { view: Permissions.AssessmentView, create: Permissions.AssessmentCreate, manage: Permissions.AssessmentCreate },
  admissions: { view: Permissions.AdmissionView, create: Permissions.AdmissionCreate, manage: Permissions.AdmissionUpdate, note: Permissions.AdmissionUpdate },
  "medical-events": { view: Permissions.MedicalEventView, create: Permissions.AssessmentCreate, manage: Permissions.AssessmentCreate },
  documents: { view: Permissions.DocumentView, create: Permissions.DocumentManage, manage: Permissions.DocumentManage },
  pharmacy: { view: Permissions.PharmacyView, create: Permissions.PharmacyManage, manage: Permissions.PharmacyManage },
  theatre: { view: Permissions.TheatreView, create: Permissions.TheatreManage, manage: Permissions.TheatreManage },
  ward: { view: Permissions.WardView, create: Permissions.WardManage, manage: Permissions.WardManage },
  "case-management": { view: Permissions.CaseView, create: Permissions.CaseManage, manage: Permissions.CaseManage },
  "clinical-coding": { view: Permissions.CodingView, create: Permissions.CodingManage, manage: Permissions.CodingManage },
  authorisations: { view: Permissions.AuthorisationView, create: Permissions.AuthorisationManage, manage: Permissions.AuthorisationManage },
  funding: { view: Permissions.FundingView, create: Permissions.FundingManage, manage: Permissions.FundingManage },
  billing: { view: Permissions.BillingView, create: Permissions.BillingManage, manage: Permissions.BillingManage },
  accounting: { view: Permissions.AccountingView, create: Permissions.AccountingManage, manage: Permissions.AccountingManage },
  coid: { view: Permissions.CoidView, create: Permissions.CoidManage, manage: Permissions.CoidManage },
  reimbursements: { view: Permissions.AccountingView, create: Permissions.AccountingManage, manage: Permissions.AccountingManage },
  "supplier-invoices": { view: Permissions.AccountingView, create: Permissions.AccountingManage, manage: Permissions.AccountingManage },
  "account-enquiries": { view: Permissions.AccountingView, create: Permissions.AccountingManage, manage: Permissions.AccountingManage },
  adhoc: { view: Permissions.BillingView, create: Permissions.BillingManage, manage: Permissions.BillingManage },
  facilities: { view: Permissions.FacilityView, create: Permissions.FacilityManage, manage: Permissions.FacilityManage },
  practitioners: { view: Permissions.PractitionerView, create: Permissions.PractitionerManage, manage: Permissions.PractitionerManage },
  integrations: { view: Permissions.IntegrationView, create: Permissions.IntegrationRetry, manage: Permissions.IntegrationReplay },
  "service-bus": { view: Permissions.IntegrationView, create: Permissions.IntegrationRetry, manage: Permissions.IntegrationReplay },
  "failed-messages": { view: Permissions.IntegrationView, create: Permissions.IntegrationRetry, manage: Permissions.IntegrationReplay },
  services: { view: Permissions.IntegrationView, create: Permissions.IntegrationRetry, manage: Permissions.IntegrationReplay },
  "system-health": { view: Permissions.SystemHealthView, create: Permissions.IntegrationRetry, manage: Permissions.IntegrationReplay },
  notifications: { view: Permissions.NotificationView, create: Permissions.NotificationView, manage: Permissions.NotificationView },
  audit: { view: Permissions.AuditView, create: Permissions.AuditView, manage: Permissions.AuditView, export: Permissions.AuditExport },
  admin: { view: Permissions.AdministrationView, create: Permissions.AdministrationManage, manage: Permissions.AdministrationManage },
  reports: { view: Permissions.ReportView, create: Permissions.ReportView, manage: Permissions.ReportView },
  "workflow-inbox": { view: Permissions.WorkflowView, create: Permissions.WorkflowView, manage: Permissions.WorkflowView },
};

export function getDefaultModulePermissions(moduleKey: ModuleKey): DefaultModulePermissions {
  const defaults = mapping[moduleKey];
  return { ...defaults, export: defaults.export ?? Permissions.ExportData };
}
