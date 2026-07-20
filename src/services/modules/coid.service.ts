import { createModuleService } from "@/services/modules/base-module.service";

export const coidService = createModuleService({ moduleKey: "coid", basePath: "coid", workflowKey: "coid" });
