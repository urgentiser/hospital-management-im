import { createModuleService } from "@/services/modules/base-module.service";

export const caseManagementService = createModuleService({ moduleKey: "case-management", basePath: "case-management", workflowKey: "case-management" });
