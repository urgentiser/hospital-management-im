import { createModuleService } from "@/services/modules/base-module.service";

export const integrationsAndSupportService = createModuleService({ moduleKey: "integrations-and-support", basePath: "integrations", workflowKey: "integrations" });
