import { memberValidationService } from "@/services/modules/member-validation.service";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import { triageService } from "@/services/modules/triage.service";
import { clinicalAssessmentService } from "@/services/modules/clinical-assessment.service";
import { preadmissionService } from "@/services/modules/preadmission.service";
import { admissionsService } from "@/services/modules/admissions.service";
import { authorisationsService } from "@/services/modules/authorisations.service";
import { medicalEventsService } from "@/services/modules/medical-events.service";
import { pharmacyService } from "@/services/modules/pharmacy.service";
import { theatreManagementService } from "@/services/modules/theatre-management.service";
import { wardManagementService } from "@/services/modules/ward-management.service";
import { facilitiesService } from "@/services/modules/facilities.service";
import { practitionersService } from "@/services/modules/practitioners.service";
import { caseManagementService } from "@/services/modules/case-management.service";
import { clinicalCodingService } from "@/services/modules/clinical-coding.service";
import { billingService } from "@/services/modules/billing.service";
import { fundingService } from "@/services/modules/funding.service";
import { accountingService } from "@/services/modules/accounting.service";
import { reimbursementsService } from "@/services/modules/reimbursements.service";
import { coidService } from "@/services/modules/coid.service";
import { adhocAndSupplierInvoicesService } from "@/services/modules/adhoc-and-supplier-invoices.service";
import { documentsAndPrintingService } from "@/services/modules/documents-and-printing.service";
import { workflowInboxService } from "@/services/modules/workflow-inbox.service";
import { mylifePortalService } from "@/services/modules/mylife-portal.service";
import { integrationsAndSupportService } from "@/services/modules/integrations-and-support.service";
import { auditTrailService } from "@/services/modules/audit-trail.service";
import { administrationService } from "@/services/modules/administration.service";
import { multitouchCensusService } from "@/services/modules/multitouch-census.service";
import { multitouchTheatreService } from "@/services/modules/multitouch-theatre.service";
import { multitouchWardService } from "@/services/modules/multitouch-ward.service";
import { multitouchEventAndUserRegistrationService } from "@/services/modules/multitouch-event-and-user-registration.service";
import { productCataloguePcmsService } from "@/services/modules/product-catalogue-pcms.service";
import { chargesCatalogueService } from "@/services/modules/charges-catalogue.service";
import { funderCatalogueService } from "@/services/modules/funder-catalogue.service";
import { reimbursementsCatalogueService } from "@/services/modules/reimbursements-catalogue.service";
import { nonconsumablesCatalogueService } from "@/services/modules/nonconsumables-catalogue.service";
import { vivoSecurityService } from "@/services/modules/vivo-security.service";
import { paymentsService } from "@/services/modules/payments.service";
import { claimsService } from "@/services/modules/claims.service";
import { resolveCurrentStateModuleKey } from "@/current-state/module-manifest";
import type { ModuleService } from "@/services/modules/types";

const services: Record<string, ModuleService> = {
  "member-validation": memberValidationService,
  "patient-maintenance": patientMaintenanceService,
  "triage": triageService,
  "clinical-assessment": clinicalAssessmentService,
  "preadmission": preadmissionService,
  "admissions": admissionsService,
  "authorisations": authorisationsService,
  "medical-events": medicalEventsService,
  "pharmacy": pharmacyService,
  "theatre-management": theatreManagementService,
  "ward-management": wardManagementService,
  "facilities": facilitiesService,
  "practitioners": practitionersService,
  "case-management": caseManagementService,
  "clinical-coding": clinicalCodingService,
  "billing": billingService,
  "funding": fundingService,
  "accounting": accountingService,
  "reimbursements": reimbursementsService,
  "coid": coidService,
  "adhoc-and-supplier-invoices": adhocAndSupplierInvoicesService,
  "documents-and-printing": documentsAndPrintingService,
  "workflow-inbox": workflowInboxService,
  "mylife-portal": mylifePortalService,
  "integrations-and-support": integrationsAndSupportService,
  "audit-trail": auditTrailService,
  "administration": administrationService,
  "multitouch-census": multitouchCensusService,
  "multitouch-theatre": multitouchTheatreService,
  "multitouch-ward": multitouchWardService,
  "multitouch-event-and-user-registration": multitouchEventAndUserRegistrationService,
  "product-catalogue-pcms": productCataloguePcmsService,
  "charges-catalogue": chargesCatalogueService,
  "funder-catalogue": funderCatalogueService,
  "reimbursements-catalogue": reimbursementsCatalogueService,
  "nonconsumables-catalogue": nonconsumablesCatalogueService,
  "vivo-security": vivoSecurityService,
};

export function getModuleService(moduleKey: string): ModuleService {
  const resolved = resolveCurrentStateModuleKey(moduleKey) ?? moduleKey;
  const service = services[resolved];
  if (!service) throw new Error(`No frontend service is registered for module '${moduleKey}'.`);
  return service;
}

export function getRegisteredModuleServices(): ModuleService[] {
  return Object.values(services);
}
