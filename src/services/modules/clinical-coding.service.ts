import { createModuleService } from "@/services/modules/base-module.service";

export const clinicalCodingService = createModuleService({ moduleKey: "clinical-coding", basePath: "clinical-coding", workflowKey: "clinical-coding" });
