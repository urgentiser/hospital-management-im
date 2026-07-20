import { createModuleService } from "@/services/modules/base-module.service";

export const workflowInboxService = createModuleService({ moduleKey: "workflow-inbox", basePath: "workflow-inbox", workflowKey: "workflow-inbox" });
