import type { CurrentStateModuleSpecification } from "@/current-state/types";
import { resolveCurrentStateModuleKey } from "@/current-state/module-manifest";

const loaders: Record<string, () => Promise<CurrentStateModuleSpecification>> = {
  "member-validation": () => import("@/current-state/data/member-validation.json").then((module) => module.default as CurrentStateModuleSpecification),
  "patient-maintenance": () => import("@/current-state/data/patient-maintenance.json").then((module) => module.default as CurrentStateModuleSpecification),
  "triage": () => import("@/current-state/data/triage.json").then((module) => module.default as CurrentStateModuleSpecification),
  "clinical-assessment": () => import("@/current-state/data/clinical-assessment.json").then((module) => module.default as CurrentStateModuleSpecification),
  "preadmission": () => import("@/current-state/data/preadmission.json").then((module) => module.default as CurrentStateModuleSpecification),
  "admissions": () => import("@/current-state/data/admissions.json").then((module) => module.default as CurrentStateModuleSpecification),
  "authorisations": () => import("@/current-state/data/authorisations.json").then((module) => module.default as CurrentStateModuleSpecification),
  "medical-events": () => import("@/current-state/data/medical-events.json").then((module) => module.default as CurrentStateModuleSpecification),
  "pharmacy": () => import("@/current-state/data/pharmacy.json").then((module) => module.default as CurrentStateModuleSpecification),
  "theatre-management": () => import("@/current-state/data/theatre-management.json").then((module) => module.default as CurrentStateModuleSpecification),
  "ward-management": () => import("@/current-state/data/ward-management.json").then((module) => module.default as CurrentStateModuleSpecification),
  "facilities": () => import("@/current-state/data/facilities.json").then((module) => module.default as CurrentStateModuleSpecification),
  "practitioners": () => import("@/current-state/data/practitioners.json").then((module) => module.default as CurrentStateModuleSpecification),
  "case-management": () => import("@/current-state/data/case-management.json").then((module) => module.default as CurrentStateModuleSpecification),
  "clinical-coding": () => import("@/current-state/data/clinical-coding.json").then((module) => module.default as CurrentStateModuleSpecification),
  "billing": () => import("@/current-state/data/billing.json").then((module) => module.default as CurrentStateModuleSpecification),
  "funding": () => import("@/current-state/data/funding.json").then((module) => module.default as CurrentStateModuleSpecification),
  "accounting": () => import("@/current-state/data/accounting.json").then((module) => module.default as CurrentStateModuleSpecification),
  "reimbursements": () => import("@/current-state/data/reimbursements.json").then((module) => module.default as CurrentStateModuleSpecification),
  "coid": () => import("@/current-state/data/coid.json").then((module) => module.default as CurrentStateModuleSpecification),
  "adhoc-and-supplier-invoices": () => import("@/current-state/data/adhoc-and-supplier-invoices.json").then((module) => module.default as CurrentStateModuleSpecification),
  "documents-and-printing": () => import("@/current-state/data/documents-and-printing.json").then((module) => module.default as CurrentStateModuleSpecification),
  "workflow-inbox": () => import("@/current-state/data/workflow-inbox.json").then((module) => module.default as CurrentStateModuleSpecification),
  "mylife-portal": () => import("@/current-state/data/mylife-portal.json").then((module) => module.default as CurrentStateModuleSpecification),
  "integrations-and-support": () => import("@/current-state/data/integrations-and-support.json").then((module) => module.default as CurrentStateModuleSpecification),
  "audit-trail": () => import("@/current-state/data/audit-trail.json").then((module) => module.default as CurrentStateModuleSpecification),
  "administration": () => import("@/current-state/data/administration.json").then((module) => module.default as CurrentStateModuleSpecification),
  "multitouch-census": () => import("@/current-state/data/multitouch-census.json").then((module) => module.default as CurrentStateModuleSpecification),
  "multitouch-theatre": () => import("@/current-state/data/multitouch-theatre.json").then((module) => module.default as CurrentStateModuleSpecification),
  "multitouch-ward": () => import("@/current-state/data/multitouch-ward.json").then((module) => module.default as CurrentStateModuleSpecification),
  "multitouch-event-and-user-registration": () => import("@/current-state/data/multitouch-event-and-user-registration.json").then((module) => module.default as CurrentStateModuleSpecification),
  "product-catalogue-pcms": () => import("@/current-state/data/product-catalogue-pcms.json").then((module) => module.default as CurrentStateModuleSpecification),
  "charges-catalogue": () => import("@/current-state/data/charges-catalogue.json").then((module) => module.default as CurrentStateModuleSpecification),
  "funder-catalogue": () => import("@/current-state/data/funder-catalogue.json").then((module) => module.default as CurrentStateModuleSpecification),
  "reimbursements-catalogue": () => import("@/current-state/data/reimbursements-catalogue.json").then((module) => module.default as CurrentStateModuleSpecification),
  "nonconsumables-catalogue": () => import("@/current-state/data/nonconsumables-catalogue.json").then((module) => module.default as CurrentStateModuleSpecification),
  "vivo-security": () => import("@/current-state/data/vivo-security.json").then((module) => module.default as CurrentStateModuleSpecification),
};

const cache = new Map<string, CurrentStateModuleSpecification>();

export async function loadCurrentStateModule(value: string): Promise<CurrentStateModuleSpecification | null> {
  const key = resolveCurrentStateModuleKey(value);
  if (!key) return null;
  const cached = cache.get(key);
  if (cached) return cached;
  const loader = loaders[key];
  if (!loader) return null;
  const specification = await loader();
  cache.set(key, specification);
  return specification;
}
