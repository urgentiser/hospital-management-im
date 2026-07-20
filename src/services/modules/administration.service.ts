import { createModuleService } from "@/services/modules/base-module.service";

export const administrationService = createModuleService({ moduleKey: "administration", basePath: "administration", workflowKey: "admin" });
