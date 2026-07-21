import { createModuleService } from "@/services/modules/base-module.service";

export const claimsService = createModuleService({ moduleKey: "claims", basePath: "claims", workflowKey: "claims" });
