import { createModuleService } from "@/services/modules/base-module.service";

export const preadmissionService = createModuleService({ moduleKey: "preadmission", basePath: "preadmissions", workflowKey: "preadmissions" });
