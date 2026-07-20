import { createModuleService } from "@/services/modules/base-module.service";

export const admissionsService = createModuleService({ moduleKey: "admissions", basePath: "admissions", workflowKey: "admissions" });
