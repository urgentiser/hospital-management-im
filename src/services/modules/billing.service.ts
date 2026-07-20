import { createModuleService } from "@/services/modules/base-module.service";

export const billingService = createModuleService({ moduleKey: "billing", basePath: "billing", workflowKey: "billing" });
