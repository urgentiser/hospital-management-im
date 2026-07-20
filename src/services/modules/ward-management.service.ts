import { createModuleService } from "@/services/modules/base-module.service";

export const wardManagementService = createModuleService({ moduleKey: "ward-management", basePath: "ward-management", workflowKey: "ward" });
