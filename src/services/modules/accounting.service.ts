import { createModuleService } from "@/services/modules/base-module.service";

export const accountingService = createModuleService({ moduleKey: "accounting", basePath: "accounting", workflowKey: "accounting" });
