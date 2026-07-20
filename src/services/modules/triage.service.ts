import { createModuleService } from "@/services/modules/base-module.service";

export const triageService = createModuleService({ moduleKey: "triage", basePath: "triage", workflowKey: "triage" });
