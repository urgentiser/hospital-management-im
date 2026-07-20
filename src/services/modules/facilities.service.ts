import { createModuleService } from "@/services/modules/base-module.service";

export const facilitiesService = createModuleService({ moduleKey: "facilities", basePath: "facilities", workflowKey: "facilities" });
