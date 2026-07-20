import { createModuleService } from "@/services/modules/base-module.service";

export const fundingService = createModuleService({ moduleKey: "funding", basePath: "funding", workflowKey: "funding" });
