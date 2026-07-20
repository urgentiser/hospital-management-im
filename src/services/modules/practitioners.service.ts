import { createModuleService } from "@/services/modules/base-module.service";

export const practitionersService = createModuleService({ moduleKey: "practitioners", basePath: "practitioners", workflowKey: "practitioners" });
