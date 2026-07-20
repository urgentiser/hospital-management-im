import { createModuleService } from "@/services/modules/base-module.service";

export const authorisationsService = createModuleService({ moduleKey: "authorisations", basePath: "authorisations", workflowKey: "authorisations" });
