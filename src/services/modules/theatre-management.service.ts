import { createModuleService } from "@/services/modules/base-module.service";

export const theatreManagementService = createModuleService({ moduleKey: "theatre-management", basePath: "theatre-management", workflowKey: "theatre" });
