import { createModuleService } from "@/services/modules/base-module.service";

export const pharmacyService = createModuleService({ moduleKey: "pharmacy", basePath: "pharmacy", workflowKey: "pharmacy" });
