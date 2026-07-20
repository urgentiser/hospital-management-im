import { createModuleService } from "@/services/modules/base-module.service";

export const auditTrailService = createModuleService({ moduleKey: "audit-trail", basePath: "audit", workflowKey: "audit" });
