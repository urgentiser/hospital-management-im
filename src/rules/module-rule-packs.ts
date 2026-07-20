import { resolveCurrentStateModuleKey } from "@/current-state/module-manifest";

const patientModules = new Set([
  "member-validation", "patient-maintenance", "triage", "clinical-assessment", "preadmission", "admissions",
  "authorisations", "medical-events", "pharmacy", "theatre-management", "ward-management", "case-management",
  "clinical-coding", "billing", "accounting", "reimbursements", "coid", "documents-and-printing",
]);
const financialModules = new Set(["authorisations", "billing", "funding", "accounting", "reimbursements", "adhoc-and-supplier-invoices", "coid", "charges-catalogue", "funder-catalogue", "reimbursements-catalogue"]);
const documentModules = new Set(["documents-and-printing"]);
const integrationModules = new Set(["integrations-and-support", "multitouch-census", "multitouch-theatre", "multitouch-ward", "multitouch-event-and-user-registration", "product-catalogue-pcms", "charges-catalogue", "funder-catalogue", "reimbursements-catalogue", "nonconsumables-catalogue"]);
const locationModules = new Set(["preadmission", "admissions", "triage", "clinical-assessment", "ward-management", "theatre-management", "pharmacy", "case-management", "multitouch-census", "multitouch-ward", "multitouch-theatre"]);

export function getModuleRuleIds(moduleKey: string, action: string): string[] {
  const resolved = resolveCurrentStateModuleKey(moduleKey) ?? moduleKey;
  const ids = ["legacy.temporal-order", "legacy.controlled-action-reason"];
  if (patientModules.has(resolved)) ids.push("legacy.patient-identity");
  if (financialModules.has(resolved)) ids.push("legacy.non-negative-values");
  if (documentModules.has(resolved) || /document|upload|print/i.test(action)) ids.push("legacy.document-metadata");
  if (integrationModules.has(resolved)) ids.push("legacy.integration-retry-policy");
  if (locationModules.has(resolved)) ids.push("legacy.facility-ward-consistency");
  if (resolved === "admissions") ids.push("admission.discharge-after-admission");
  if (resolved === "accounting" && /refund/i.test(action)) ids.push("accounting.refund-within-payment");
  if (resolved === "coid") ids.push("coid.employer-required");
  return [...new Set(ids)];
}
